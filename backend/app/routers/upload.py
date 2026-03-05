"""File upload API: POST /upload."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.auth.dependencies import get_current_user_optional
from app.config import DB_PATH, DB_UPLOAD_BASE_PATH
from app.uploads import store_file

router = APIRouter(tags=["upload"])


@router.post("/upload")
async def upload_file(
    file: Annotated[UploadFile, File()],
    user: Annotated[Optional[dict], Depends(get_current_user_optional)] = None,
):
    """
    Upload file. SHA-256 deduplication. Returns URL for embedding.
    Requires authentication.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    try:
        h, url_path = store_file(
            DB_PATH,
            DB_UPLOAD_BASE_PATH,
            content,
            user["user_id"],
        )
        base = ""  # Frontend will prefix with API URL
        return {"hash": h, "url": url_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
