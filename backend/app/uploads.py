"""File upload handling: SHA-256 deduplication, USER_UPLOADS tracking."""
import hashlib
import json
from pathlib import Path
from typing import Optional


def _uploads_path(db_path: Path) -> Path:
    return db_path / "USER_UPLOADS"


def _read_uploads(db_path: Path) -> dict:
    path = _uploads_path(db_path)
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _write_uploads(db_path: Path, data: dict) -> None:
    path = _uploads_path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    tmp.rename(path)


def store_file(
    db_path: Path,
    upload_base: Path,
    content: bytes,
    user_id: str,
) -> tuple[str, str]:
    """
    Store file with SHA-256 deduplication.
    Returns (file_hash, url_path).
    """
    h = hashlib.sha256(content).hexdigest()
    upload_base.mkdir(parents=True, exist_ok=True)
    dest = upload_base / h
    if not dest.exists():
        dest.write_bytes(content)
    uploads = _read_uploads(db_path)
    if user_id not in uploads:
        uploads[user_id] = []
    if h not in uploads[user_id]:
        uploads[user_id].append(h)
        _write_uploads(db_path, uploads)
    return h, f"/uploads/{h}"
