"""File-based ResourceDB: INDEX, TAGS, MARKS, and resource CRUD operations."""
import json
import os
import uuid
from pathlib import Path
from typing import Literal, Optional

from .schemas import ResourceIn, ResourceStored

Version = Literal["Draft", "Published", "Deleted"]


class ResourceDB:
    """File-based resource storage with INDEX, TAGS, MARKS."""

    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.db_path.mkdir(parents=True, exist_ok=True)
        self.index_path = self.db_path / "INDEX"
        self.tags_path = self.db_path / "TAGS"
        self.marks_path = self.db_path / "MARKS"
        self._ensure_files()

    def _ensure_files(self) -> None:
        """Create INDEX, TAGS, MARKS if they don't exist."""
        if not self.index_path.exists():
            self._write_json(self.index_path, {})
        if not self.tags_path.exists():
            self._write_json(self.tags_path, [])
        if not self.marks_path.exists():
            self._write_json(self.marks_path, [])

    def _read_json(self, path: Path) -> dict | list:
        """Read JSON file atomically."""
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {} if "INDEX" in path.name or "MARKS" in path.name else []

    def _write_json(self, path: Path, data: dict | list) -> None:
        """Write JSON file atomically (write to temp, then replace)."""
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp, path)  # Atomic on all platforms; replaces target on Windows

    def _load_index(self) -> dict[str, dict[str, str]]:
        """Load INDEX: slug -> { version -> uid }."""
        raw = self._read_json(self.index_path)
        return raw if isinstance(raw, dict) else {}

    def _save_index(self, index: dict[str, dict[str, str]]) -> None:
        """Save INDEX."""
        self._write_json(self.index_path, index)

    def _load_tags(self) -> list[str]:
        """Load allowed tags."""
        raw = self._read_json(self.tags_path)
        return raw if isinstance(raw, list) else []

    def _load_marks(self) -> list[str]:
        """Load slugs marked for publication."""
        raw = self._read_json(self.marks_path)
        return raw if isinstance(raw, list) else []

    def _save_marks(self, marks: list[str]) -> None:
        """Save MARKS."""
        self._write_json(self.marks_path, marks)

    def _validate_tags(self, tags: list[str]) -> None:
        """Validate tags against allowed list. Empty TAGS = allow any."""
        allowed = self._load_tags()
        if not allowed:
            return
        for t in tags:
            if t not in allowed:
                raise ValueError(f"Tag '{t}' is not in allowed list")

    def _read_resource_file(self, uid: str) -> dict:
        """Read resource JSON by UID."""
        path = self.db_path / f"{uid}.json"
        if not path.exists():
            raise FileNotFoundError(f"Resource {uid} not found")
        data = self._read_json(path)
        if not isinstance(data, dict):
            raise ValueError(f"Invalid resource file {uid}")
        data["uid"] = uid
        return data

    def _write_resource_file(self, uid: str, data: dict) -> None:
        """Write resource JSON by UID."""
        path = self.db_path / f"{uid}.json"
        payload = {k: v for k, v in data.items() if k != "uid"}
        self._write_json(path, payload)

    def get(
        self, slug: str, version: Version = "Published"
    ) -> Optional[ResourceStored]:
        """Get resource by slug and version."""
        index = self._load_index()
        slugs = index.get(slug)
        if not slugs:
            return None
        uid = slugs.get(version)
        if not uid:
            return None
        try:
            data = self._read_resource_file(uid)
            data["slug"] = slug
            data["version"] = version
            return ResourceStored(**data)
        except (FileNotFoundError, ValueError):
            return None

    def create(self, slug: str, data: ResourceIn, author_user_id: str) -> ResourceStored:
        """Create new resource. User becomes Owner."""
        index = self._load_index()
        if slug in index:
            raise ValueError(f"Resource slug '{slug}' already exists")
        self._validate_tags(data.tags)
        uid = uuid.uuid4().hex
        from datetime import datetime

        now = datetime.utcnow().isoformat() + "Z"
        authors = (
            [{"user_id": author_user_id, "authorship": "Owner"}]
            if not data.authors
            else [a.model_dump() for a in data.authors]
        )
        stored = {
            "uid": uid,
            "slug": slug,
            "last_updated": now,
            "authors": authors,
            "tags": data.tags,
            "title": data.title,
            "subtitle": data.subtitle,
            "abstract": data.abstract,
            "logo": data.logo,
            "banner": data.banner,
            "content": data.content,
            "bibliography": data.bibliography,
        }
        self._write_resource_file(uid, stored)
        index[slug] = {"Draft": uid}
        self._save_index(index)
        return ResourceStored(**stored, version="Draft")

    def update(self, slug: str, data: ResourceIn) -> ResourceStored:
        """Update Draft only. If no Draft but Published exists, create Draft from Published first."""
        index = self._load_index()
        slugs = index.get(slug)
        if not slugs:
            raise ValueError(f"Resource '{slug}' not found")
        uid = slugs.get("Draft")
        if not uid:
            pub_uid = slugs.get("Published")
            if not pub_uid:
                raise ValueError(f"No Draft or Published version for '{slug}'")
            try:
                pub_data = self._read_resource_file(pub_uid)
            except (FileNotFoundError, ValueError):
                raise ValueError(f"Published version for '{slug}' is corrupted or missing")
            from datetime import datetime
            now = datetime.utcnow().isoformat() + "Z"
            draft_uid = uuid.uuid4().hex
            stored = {k: v for k, v in pub_data.items() if k != "uid"}
            stored["last_updated"] = now
            self._write_resource_file(draft_uid, stored)
            index[slug]["Draft"] = draft_uid
            self._save_index(index)
            uid = draft_uid
        self._validate_tags(data.tags)
        from datetime import datetime

        now = datetime.utcnow().isoformat() + "Z"
        existing = self._read_resource_file(uid)
        stored = {
            "uid": uid,
            "slug": slug,
            "last_updated": now,
            "authors": [a.model_dump() for a in data.authors],
            "tags": data.tags,
            "title": data.title,
            "subtitle": data.subtitle,
            "abstract": data.abstract,
            "logo": data.logo,
            "banner": data.banner,
            "content": data.content,
            "bibliography": data.bibliography,
        }
        self._write_resource_file(uid, stored)
        return ResourceStored(**stored, version="Draft")

    def mark_for_publication(self, slug: str) -> None:
        """Add slug to MARKS."""
        index = self._load_index()
        if slug not in index or "Draft" not in index[slug]:
            raise ValueError(f"No Draft for '{slug}'")
        marks = self._load_marks()
        if slug not in marks:
            marks.append(slug)
            self._save_marks(marks)

    def publish(self, slug: str) -> ResourceStored:
        """Copy Draft -> Published."""
        index = self._load_index()
        slugs = index.get(slug)
        if not slugs:
            raise ValueError(f"Resource '{slug}' not found")
        draft_uid = slugs.get("Draft")
        if not draft_uid:
            raise ValueError(f"No Draft for '{slug}'")
        draft_data = self._read_resource_file(draft_uid)
        published_uid = uuid.uuid4().hex
        draft_data["uid"] = published_uid
        self._write_resource_file(published_uid, draft_data)
        index[slug]["Published"] = published_uid
        self._save_index(index)
        marks = self._load_marks()
        if slug in marks:
            marks.remove(slug)
            self._save_marks(marks)
        return ResourceStored(**draft_data, version="Published")

    def delete(self, slug: str, soft: bool = True) -> None:
        """Unpublish or soft-delete. If soft, set Published -> Deleted."""
        index = self._load_index()
        if slug not in index:
            raise ValueError(f"Resource '{slug}' not found")
        if soft:
            if "Published" in index[slug]:
                pub_uid = index[slug]["Published"]
                index[slug]["Deleted"] = pub_uid
                del index[slug]["Published"]
        else:
            del index[slug]
        self._save_index(index)
        marks = self._load_marks()
        if slug in marks:
            marks.remove(slug)
            self._save_marks(marks)

    def move(self, slug: str, new_slug: str) -> None:
        """Move resource to new slug."""
        index = self._load_index()
        if slug not in index:
            raise ValueError(f"Resource '{slug}' not found")
        if new_slug in index:
            raise ValueError(f"Slug '{new_slug}' already exists")
        index[new_slug] = index.pop(slug)
        self._save_index(index)
        marks = self._load_marks()
        if slug in marks:
            marks.remove(slug)
            marks.append(new_slug)
            self._save_marks(marks)

    def list_all_slugs(self) -> list[str]:
        """List all resource slugs."""
        return list(self._load_index().keys())
