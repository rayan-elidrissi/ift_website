"""Admin export: zip db/ and uploads/ for download."""
import io
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.auth.dependencies import get_current_user
from app.config import DB_PATH, DB_UPLOAD_BASE_PATH

router = APIRouter(prefix="/admin", tags=["admin"])


def _should_skip(path: Path) -> bool:
    """Skip __pycache__, .tmp files, and other non-essential paths."""
    if "__pycache__" in path.parts:
        return True
    if path.suffix == ".tmp" or path.name.endswith(".tmp"):
        return True
    return False


def _add_directory_to_zip(zf: zipfile.ZipFile, base_path: Path, arc_prefix: str) -> None:
    """Recursively add directory contents to zip, skipping excluded paths."""
    if not base_path.exists() or not base_path.is_dir():
        return
    for path in base_path.rglob("*"):
        if not path.is_file() or _should_skip(path):
            continue
        try:
            arcname = f"{arc_prefix}/{path.relative_to(base_path)}"
            zf.write(path, arcname=arcname)
        except (OSError, ValueError):
            continue


@router.get("/export")
def export_backup(
    user: Annotated[dict, Depends(get_current_user)],
):
    """
    Download full CMS backup (db/ + uploads/) as ZIP.
    Admin only.
    """
    if not user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin required",
        )

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        _add_directory_to_zip(zf, DB_PATH, "db")
        _add_directory_to_zip(zf, DB_UPLOAD_BASE_PATH, "uploads")

    buffer.seek(0)
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    filename = f"cms-backup-{timestamp}.zip"

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
