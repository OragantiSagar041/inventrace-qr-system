from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class ShopDashboardResponse(BaseModel):
    shop_id: str
    shop_name: str
    location: str
    total_products: int
    total_stock: int
    pending_units: int
    sold_units: int
    total_revenue: float
    recent_sales: list[dict]
    daily_sales: list[dict] = []  # [{ "date": "...", "count": 0 }]
    alerts: list[dict] = []       # [{ "product_name": "...", "product_id": "..." }]


class ShopSaleRecord(BaseModel):
    inventory_id: str
    product_id: str
    product_name: str
    serial_number: str
    total_price: float
    sold_at: datetime | None = None
