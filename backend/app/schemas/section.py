from pydantic import BaseModel, Field

from app.schemas.common import TimestampedModel


class SectionCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=255)


class SectionResponse(TimestampedModel):
    section_id: str
    name: str
    description: str | None = None
