"""Auth dependencies: JWTBearer, has_access. Phase 3: full ACL."""
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import DB_PATH, JWT_ALGORITHM, JWT_SECRET
from app.db.user_db import UserDB

security = HTTPBearer(auto_error=False)
user_db = UserDB(DB_PATH)


def get_current_user_optional(
    request: Request,
    credentials: Annotated[
        Optional[HTTPAuthorizationCredentials], Depends(security)
    ] = None,
) -> Optional[dict]:
    """
    Extract user from JWT (Bearer or cookie) or proxy token.
    Returns None if not authenticated.
    """
    token = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    else:
        token = request.cookies.get("ift_auth")

    if not token:
        return None

    # Try proxy token first
    user_id = user_db.resolve_token(token)
    if user_id:
        full_user = user_db.get_user(user_id)
        if full_user:
            return _user_to_auth_dict(full_user)
        return None

    # Try JWT
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            return None
        auth_user = {
            "user_id": user_id,
            "username": payload.get("username", ""),
            "email": payload.get("email", ""),
            "groups": payload.get("groups", []),
            "is_admin": payload.get("is_admin", False),
        }
        # Enrich with full user for ACL
        full = user_db.get_user(user_id)
        if full:
            auth_user["_full"] = full
        return auth_user
    except JWTError:
        return None


def _user_to_auth_dict(u: dict) -> dict:
    return {
        "user_id": u.get("user_id", ""),
        "username": u.get("username", ""),
        "email": u.get("email", ""),
        "groups": u.get("groups", []),
        "is_admin": u.get("is_admin", False),
        "_full": u,
    }


def get_current_user(
    user: Annotated[Optional[dict], Depends(get_current_user_optional)]
) -> dict:
    """Require authentication. Raise 401 if not authenticated."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user


def _acl_match(rule: dict, slug: str, version: str, tags: list[str]) -> bool:
    """Check if ACL rule matches resource."""
    if rule.get("resource_slug") and rule["resource_slug"] != slug:
        return False
    if rule.get("versions") and version not in rule["versions"]:
        return False
    if rule.get("tags"):
        for t in rule["tags"]:
            if t not in tags:
                return False
    return True


def _user_has_action(
    user: dict, slug: str, version: str, action: str, resource_tags: list[str]
) -> bool:
    """Check user ACL (personal + groups) for action."""
    full = user.get("_full") or user_db.get_user(user.get("user_id", ""))
    if not full:
        return False
    acl_rules = full.get("acl", [])
    for g in full.get("groups", []):
        acl_rules.extend(user_db.get_group_acl(g))
    for rule in acl_rules:
        if _acl_match(rule, slug, version, resource_tags):
            if action in rule.get("actions", []):
                return True
    return False


def has_access(
    user: Optional[dict],
    resource_slug: str,
    version: str,
    action: str,
    resource_authors: Optional[list] = None,
    resource_tags: Optional[list[str]] = None,
) -> bool:
    """
    Full ACL: Admin, Published READ, personal page, authorship, ACL rules.
    """
    tags = resource_tags or []
    authors = resource_authors or []

    if not user:
        if version == "Published" and action == "READ":
            return True
        # Dev/migration: allow READ+UPDATE on Draft when resource was created by anonymous
        if version == "Draft" and action in ("READ", "UPDATE"):
            author_ids = [
                a.get("user_id") if isinstance(a, dict) else getattr(a, "user_id", None)
                for a in authors
            ]
            if all(aid == "anonymous" for aid in author_ids if aid):
                return True
        return False

    if user.get("is_admin"):
        return True

    if version == "Published" and action == "READ":
        return True

    # Personal page: /member/{username} -> user can UPDATE
    if resource_slug.startswith("member/"):
        _, _, uname = resource_slug.partition("/")
        if uname and user.get("username") == uname and action == "UPDATE":
            return True

    # Authorship: Owner/Author -> READ, UPDATE
    user_id = user.get("user_id")
    for a in authors:
        aid = a.get("user_id") if isinstance(a, dict) else getattr(a, "user_id", None)
        role = a.get("authorship") if isinstance(a, dict) else getattr(a, "authorship", None)
        if aid == user_id and role in ("Owner", "Author"):
            if action in ("READ", "UPDATE"):
                return True

    # PUBLISH, DELETE: need explicit ACL or admin
    if action in ("PUBLISH", "DELETE"):
        return _user_has_action(user, resource_slug, version, action, tags)

    # READ, UPDATE: check ACL
    return _user_has_action(user, resource_slug, version, action, tags)
