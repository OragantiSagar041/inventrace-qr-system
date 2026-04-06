import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import get_settings

ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 72


def hash_password(password: str) -> str:
    """Hash password with SHA-256 + salt for simplicity."""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}:{hashed}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against a stored hash."""
    try:
        salt, hashed = stored_hash.split(":", 1)
        return hashlib.sha256(f"{salt}{password}".encode()).hexdigest() == hashed
    except (ValueError, AttributeError):
        return False


def create_shop_token(shop_id: str) -> str:
    """Create a JWT token for a shop."""
    settings = get_settings()
    secret = settings.admin_token or "shop-portal-secret"
    payload = {
        "shop_id": shop_id,
        "type": "shop",
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm=ALGORITHM)


def decode_shop_token(token: str) -> dict | None:
    """Decode and validate a shop JWT token."""
    settings = get_settings()
    secret = settings.admin_token or "shop-portal-secret"
    try:
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
        if payload.get("type") != "shop":
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def generate_shop_password() -> str:
    """Generate a random readable password for a shop."""
    return secrets.token_urlsafe(8)
