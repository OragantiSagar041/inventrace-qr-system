from datetime import datetime
from math import ceil
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class APIResponse(BaseModel):
    message: str


class PaginationMeta(BaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total: int = Field(ge=0)
    total_pages: int = Field(ge=0)

    @classmethod
    def build(cls, page: int, page_size: int, total: int) -> "PaginationMeta":
        return cls(page=page, page_size=page_size, total=total, total_pages=ceil(total / page_size) if total else 0)


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    meta: PaginationMeta


class TimestampedModel(BaseModel):
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
