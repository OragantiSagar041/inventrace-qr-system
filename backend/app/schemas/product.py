from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import TimestampedModel


class ProductCreate(BaseModel):
    product_id: str = Field(min_length=2, max_length=50)
    product_name: str = Field(min_length=2, max_length=120)
    section_id: str = Field(min_length=2, max_length=50)
    base_price: Decimal = Field(gt=0)
    cgst: Decimal = Field(ge=0, le=100)
    sgst: Decimal = Field(ge=0, le=100)

    @field_validator("product_id")
    @classmethod
    def normalize_product_id(cls, value: str) -> str:
        return value.strip().upper()


class ProductResponse(TimestampedModel):
    product_id: str
    product_name: str
    section_id: str
    base_price: Decimal
    cgst: Decimal
    sgst: Decimal
    total_price: Decimal
