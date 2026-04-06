from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class InventoryUnitResponse(BaseModel):
    inventory_id: str
    product_id: str
    product_name: str
    serial_number: str
    qr_token: str
    status: str
    distributed_at: datetime
    sold_at: datetime | None = None
    total_price: Decimal


class InventorySectionGroup(BaseModel):
    section_id: str
    section_name: str
    completed: int
    pending: int
    items: list[InventoryUnitResponse]


class ShopInventoryResponse(BaseModel):
    shop_id: str
    shop_name: str
    location: str
    sections: list[InventorySectionGroup]


class ProductAvailabilityResponse(BaseModel):
    product_id: str
    requested_shop_id: str
    available: bool
    message: str
    alternative_shops: list[dict]
