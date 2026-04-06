from fastapi import Header, HTTPException, status

from app.core.config import get_settings
from app.services.auth_service import decode_shop_token


async def require_admin_token(x_admin_token: str | None = Header(default=None)) -> None:
    settings = get_settings()
    if not settings.admin_token:
        return
    if x_admin_token != settings.admin_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin token.",
        )


async def require_shop_token(x_shop_token: str | None = Header(default=None)) -> str:
    """Validate shop JWT token and return the shop_id."""
    if not x_shop_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing shop authentication token.",
        )
    payload = decode_shop_token(x_shop_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired shop token.",
        )
    return payload["shop_id"]
