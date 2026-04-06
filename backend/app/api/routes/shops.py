from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import require_admin_token
from app.schemas.common import PaginatedResponse
from app.schemas.shop import ShopCreate, ShopCreateResponse, ShopResponse, ShopResetCredentials
from app.services.shop_service import ShopService

router = APIRouter(prefix="/shops", tags=["Shops"])


@router.post(
    "",
    response_model=ShopCreateResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin_token)],
)
async def create_shop(payload: ShopCreate) -> ShopCreateResponse:
    return await ShopService().create_shop(payload)


@router.get("", response_model=PaginatedResponse[ShopResponse])
async def list_shops(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[ShopResponse]:
    return await ShopService().list_shops(page, page_size)


@router.get("/{shop_id}", response_model=ShopResponse)
async def get_shop(shop_id: str) -> ShopResponse:
    shop = await ShopService().get_shop_by_id(shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return shop


@router.post(
    "/{shop_id}/reset-credentials",
    dependencies=[Depends(require_admin_token)],
)
async def reset_shop_credentials(shop_id: str, payload: ShopResetCredentials) -> dict:
    result = await ShopService().reset_credentials(shop_id, payload.password)
    if not result:
        raise HTTPException(status_code=404, detail="Shop not found")
    return result
