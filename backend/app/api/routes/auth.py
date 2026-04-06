from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.config import get_settings
from app.schemas.shop_auth import ShopLoginRequest, ShopLoginResponse, ShopMeResponse
from app.services.auth_service import create_shop_token, verify_password
from app.db.mongo import get_database

router = APIRouter(prefix="/auth", tags=["Auth"])


class AdminLoginRequest(BaseModel):
    token: str


class AdminLoginResponse(BaseModel):
    valid: bool
    message: str


@router.post("/admin-login", response_model=AdminLoginResponse)
async def admin_login(payload: AdminLoginRequest) -> AdminLoginResponse:
    settings = get_settings()
    if settings.admin_token and payload.token != settings.admin_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token.",
        )
    return AdminLoginResponse(valid=True, message="Admin authenticated successfully.")


@router.post("/shop-login", response_model=ShopLoginResponse)
async def shop_login(payload: ShopLoginRequest) -> ShopLoginResponse:
    db = get_database()
    shop = await db.shops.find_one({"username": payload.username}, {"_id": 0})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )
    if not shop.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This shop does not have login credentials. Contact admin.",
        )
    if not verify_password(payload.password, shop["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )
    token = create_shop_token(shop["shop_id"])
    return ShopLoginResponse(
        token=token,
        shop_id=shop["shop_id"],
        shop_name=shop["name"],
        location=shop["location"],
    )
