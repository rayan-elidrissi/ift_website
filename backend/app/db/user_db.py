"""User database: USERS and TOKENS (file-based JSON)."""
import json
from pathlib import Path
from typing import Optional

# USERS structure:
# {
#   "users": [
#     {
#       "user_id": "uuid",
#       "family_name": "", "given_name": "", "email": "", "username": "",
#       "level": "", "position": "", "groups": [],
#       "acl": [{ "resource_slug": "...", "versions": ["Draft"], "tags": [], "actions": ["READ","UPDATE"] }]
#     }
#   ],
#   "groups": [{ "name": "editors", "acl": [...] }]
# }

# TOKENS: { "token_hash": "user_id" }


class UserDB:
    """File-based user storage (USERS, TOKENS)."""

    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.db_path.mkdir(parents=True, exist_ok=True)
        self.users_path = self.db_path / "USERS"
        self.tokens_path = self.db_path / "TOKENS"
        self._ensure_files()

    def _ensure_files(self) -> None:
        if not self.users_path.exists():
            self._write_json(self.users_path, {"users": [], "groups": []})
        if not self.tokens_path.exists():
            self._write_json(self.tokens_path, {})

    def _read_json(self, path: Path) -> dict:
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _write_json(self, path: Path, data: dict) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        tmp.rename(path)

    def get_user(self, user_id: str) -> Optional[dict]:
        """Get user by user_id."""
        data = self._read_json(self.users_path)
        for u in data.get("users", []):
            if u.get("user_id") == user_id:
                return u
        return None

    def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get user by email."""
        data = self._read_json(self.users_path)
        for u in data.get("users", []):
            if u.get("email", "").lower() == email.lower():
                return u
        return None

    def get_user_by_username(self, username: str) -> Optional[dict]:
        """Get user by username."""
        data = self._read_json(self.users_path)
        for u in data.get("users", []):
            if u.get("username") == username:
                return u
        return None

    def upsert_user(self, user: dict) -> None:
        """Create or update user."""
        data = self._read_json(self.users_path)
        users = data.get("users", [])
        uid = user.get("user_id")
        for i, u in enumerate(users):
            if u.get("user_id") == uid:
                users[i] = {**u, **user}
                data["users"] = users
                self._write_json(self.users_path, data)
                return
        users.append(user)
        data["users"] = users
        self._write_json(self.users_path, data)

    def resolve_token(self, token: str) -> Optional[str]:
        """Resolve token to user_id. Returns None if invalid."""
        tokens = self._read_json(self.tokens_path)
        return tokens.get(token)

    def add_token(self, token: str, user_id: str) -> None:
        """Add proxy token."""
        tokens = self._read_json(self.tokens_path)
        tokens[token] = user_id
        self._write_json(self.tokens_path, tokens)

    def list_users(self) -> list[dict]:
        """List all users."""
        data = self._read_json(self.users_path)
        return data.get("users", [])

    def get_group_acl(self, group_name: str) -> list[dict]:
        """Get ACL rules for a group."""
        data = self._read_json(self.users_path)
        for g in data.get("groups", []):
            if g.get("name") == group_name:
                return g.get("acl", [])
        return []
