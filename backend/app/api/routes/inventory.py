from fastapi import APIRouter

from app.schemas.inventory import ProductAvailabilityResponse, ShopInventoryResponse
from app.services.inventory_service import InventoryService

router = APIRouter(tags=["Inventory"])


@router.get("/shop/{shop_id}/inventory", response_model=ShopInventoryResponse)
async def get_shop_inventory(shop_id: str) -> ShopInventoryResponse:
    return await InventoryService().get_shop_inventory(shop_id)


@router.get("/shop/{shop_id}/availability/{product_id}", response_model=ProductAvailabilityResponse)
async def check_product_availability(shop_id: str, product_id: str) -> ProductAvailabilityResponse:
    return await InventoryService().customer_check(shop_id, product_id)
