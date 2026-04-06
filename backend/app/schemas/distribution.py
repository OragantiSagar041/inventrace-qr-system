from datetime import datetime

from pydantic import BaseModel, Field


class DistributionCreate(BaseModel):
    shop_id: str = Field(min_length=2, max_length=50)
    product_id: str = Field(min_length=2, max_length=50)
    quantity: int = Field(gt=0, le=1000)


class DistributedUnitResponse(BaseModel):
    inventory_id: str
    serial_number: str
    qr_token: str
    qr_url: str
    status: str
    distributed_at: datetime


class DistributionResponse(BaseModel):
    shop_id: str
    product_id: str
    quantity: int
    units: list[DistributedUnitResponse]


class DistributionSummary(BaseModel):
    shop_name: str
    product_name: str
    total_units: int
    completion_percent: int
    distributed_at: datetime


class DistributionListResponse(BaseModel):
    items: list[DistributionSummary]
