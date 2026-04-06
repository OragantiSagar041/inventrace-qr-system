from datetime import datetime

from pydantic import BaseModel


class QRScanResponse(BaseModel):
    token: str
    inventory_id: str
    product_id: str
    shop_id: str
    status: str
    message: str
    sold_at: datetime | None = None
