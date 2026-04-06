from datetime import datetime

from pydantic import BaseModel


class CustomerProductView(BaseModel):
    token: str
    product_id: str
    product_name: str
    total_price: float
    shop_id: str
    shop_name: str
    shop_location: str
    status: str  # "available" or "sold"
    section_name: str | None = None


class CustomerBuyResponse(BaseModel):
    success: bool
    message: str
    product_name: str
    serial_number: str
    shop_name: str
    total_price: float
    sold_at: datetime | None = None
