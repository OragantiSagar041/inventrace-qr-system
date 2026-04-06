from fastapi import APIRouter, Depends, Query

from app.api.dependencies import require_shop_token
from app.schemas.shop_portal import ShopDashboardResponse
from app.services.shop_portal_service import ShopPortalService
from app.services.inventory_service import InventoryService
from app.schemas.inventory import ShopInventoryResponse

router = APIRouter(prefix="/shop-portal", tags=["Shop Portal"])


@router.get("/dashboard", response_model=ShopDashboardResponse)
async def shop_dashboard(shop_id: str = Depends(require_shop_token)) -> ShopDashboardResponse:
    return await ShopPortalService().get_shop_dashboard(shop_id)


@router.get("/inventory", response_model=ShopInventoryResponse)
async def shop_inventory(shop_id: str = Depends(require_shop_token)) -> ShopInventoryResponse:
    return await InventoryService().get_shop_inventory(shop_id)


@router.get("/sales")
async def shop_sales(
    shop_id: str = Depends(require_shop_token),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=30, ge=1, le=100),
) -> dict:
    return await ShopPortalService().get_sales_history(shop_id, page, page_size)
