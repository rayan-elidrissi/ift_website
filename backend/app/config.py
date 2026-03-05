"""Application configuration from environment variables."""
import os
from pathlib import Path

# Base paths
BACKEND_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_ROOT / "db"
DEFAULT_UPLOAD_PATH = BACKEND_ROOT / "uploads"

# Database
DB_PATH = Path(os.environ.get("DB_PATH", str(DEFAULT_DB_PATH)))
DB_UPLOAD_BASE_PATH = Path(
    os.environ.get("DB_UPLOAD_BASE_PATH", str(DEFAULT_UPLOAD_PATH))
)

# JWT
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# CORS - include common dev origins (localhost + 127.0.0.1, ports 3000 + 5173)
_DEFAULT_CORS = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", _DEFAULT_CORS).split(",") if o.strip()]

# OAuth (optional - for Phase 4)
OAUTH_AUTH_URL = os.environ.get("OAUTH_AUTH_URL", "")
OAUTH_TOKEN_URL = os.environ.get("OAUTH_TOKEN_URL", "")
OAUTH_USERINFO_URL = os.environ.get("OAUTH_USERINFO_URL", "")
OAUTH_CLIENT_ID = os.environ.get("OAUTH_CLIENT_ID", "")
OAUTH_CLIENT_SECRET = os.environ.get("OAUTH_CLIENT_SECRET", "")
OAUTH_REDIRECT_URI = os.environ.get("OAUTH_REDIRECT_URI", "")
OAUTH_SCOPES = os.environ.get("OAUTH_SCOPES", "openid email profile")

# Frontend URL for OAuth redirect
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
