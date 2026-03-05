"""Auth routes: OAuth login, callback, logout, /auth/me."""
import uuid
import httpx
from datetime import datetime, timedelta
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse

from app.auth.dependencies import get_current_user_optional, get_current_user
from app.config import (
    FRONTEND_URL,
    JWT_ALGORITHM,
    JWT_EXPIRE_MINUTES,
    JWT_SECRET,
    OAUTH_AUTH_URL,
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    OAUTH_REDIRECT_URI,
    OAUTH_SCOPES,
    OAUTH_TOKEN_URL,
    OAUTH_USERINFO_URL,
)
from app.db.user_db import UserDB
from app.config import DB_PATH

router = APIRouter(prefix="/auth", tags=["auth"])
user_db = UserDB(DB_PATH)


def _create_jwt(user_id: str, username: str, email: str, groups: list, is_admin: bool) -> str:
    """Create JWT for user."""
    from jose import jwt as jose_jwt
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "groups": groups,
        "is_admin": is_admin,
        "exp": expire,
    }
    return jose_jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _oauth_configured() -> bool:
    return bool(OAUTH_AUTH_URL and OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET and OAUTH_REDIRECT_URI)


@router.get("/login")
def login(request: Request, next_path: str = "/"):
    """Redirect to OAuth provider. If OAuth not configured, redirect to frontend login."""
    if not _oauth_configured():
        return RedirectResponse(url=f"{FRONTEND_URL}/login?next={next_path}")
    state = uuid.uuid4().hex
    params = {
        "client_id": OAUTH_CLIENT_ID,
        "redirect_uri": OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": OAUTH_SCOPES,
        "state": state,
    }
    url = f"{OAUTH_AUTH_URL}?{urlencode(params)}"
    response = RedirectResponse(url=url)
    response.set_cookie("oauth_state", state, max_age=600, httponly=True, samesite="lax")
    response.set_cookie("oauth_next", next_path, max_age=600, httponly=True, samesite="lax")
    return response


@router.get("/callback")
async def auth_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    """Exchange code for tokens, create/fetch user, issue JWT, redirect."""
    if error:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error={error}")
    if not _oauth_configured():
        return RedirectResponse(url=f"{FRONTEND_URL}/login")
    saved_state = request.cookies.get("oauth_state")
    next_path = request.cookies.get("oauth_next", "/")
    if not saved_state or state != saved_state or not code:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=invalid_state")

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            OAUTH_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": OAUTH_REDIRECT_URI,
                "client_id": OAUTH_CLIENT_ID,
                "client_secret": OAUTH_CLIENT_SECRET,
            },
            headers={"Accept": "application/json"},
        )
    if token_res.status_code != 200:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=token_failed")

    token_data = token_res.json()
    access_token = token_data.get("access_token")
    if not access_token:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=no_token")

    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            OAUTH_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if user_res.status_code != 200:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=userinfo_failed")

    userinfo = user_res.json()
    email = userinfo.get("email", "")
    username = userinfo.get("preferred_username") or userinfo.get("username") or email.split("@")[0]
    given_name = userinfo.get("given_name", "")
    family_name = userinfo.get("family_name", "")

    existing = user_db.get_user_by_email(email)
    if existing:
        user_id = existing["user_id"]
    else:
        user_id = str(uuid.uuid4())
        user_db.upsert_user({
            "user_id": user_id,
            "email": email,
            "username": username,
            "given_name": given_name,
            "family_name": family_name,
            "groups": [],
            "acl": [],
            "is_admin": False,
        })

    full_user = user_db.get_user(user_id)
    is_admin = full_user.get("is_admin", False)
    groups = full_user.get("groups", [])

    jwt_token = _create_jwt(user_id, username, email, groups, is_admin)
    redirect = RedirectResponse(url=f"{FRONTEND_URL}{next_path}")
    redirect.set_cookie(
        "ift_auth",
        jwt_token,
        max_age=JWT_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=OAUTH_REDIRECT_URI.startswith("https"),
    )
    redirect.delete_cookie("oauth_state")
    redirect.delete_cookie("oauth_next")
    return redirect


@router.post("/logout")
def logout():
    """Clear auth cookie."""
    resp = Response(content='{"status":"ok"}', media_type="application/json")
    resp.delete_cookie("ift_auth")
    return resp


@router.get("/me")
def auth_me(
    user: dict | None = Depends(get_current_user_optional),
):
    """Return current user from JWT."""
    if not user:
        return {"user": None}
    return {
        "user": {
            "user_id": user.get("user_id"),
            "username": user.get("username"),
            "email": user.get("email"),
            "groups": user.get("groups", []),
            "is_admin": user.get("is_admin", False),
        }
    }


@router.post("/tokens")
def create_token(
    user: dict = Depends(get_current_user),
    target_user_id: str | None = Query(None, description="User ID for token (default: self)"),
):
    """
    Create proxy token for API access. Admin only.
    Query param target_user_id (optional): create token for another user.
    Returns token (show once; store securely).
    """
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin required")
    uid = target_user_id or user.get("user_id")
    if not uid:
        raise HTTPException(status_code=400, detail="No user_id")
    if not user_db.get_user(uid):
        raise HTTPException(status_code=404, detail="User not found")
    token = uuid.uuid4().hex + uuid.uuid4().hex
    user_db.add_token(token, uid)
    return {"token": token, "user_id": uid}
