from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import TimestampedModel


class ShopCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    location: str = Field(min_length=2, max_length=150)
    contact_email: EmailStr | None = None
    password: str = Field(min_length=6, max_length=120)


class ShopResetCredentials(BaseModel):
    password: str = Field(min_length=6, max_length=120)


class ShopResponse(TimestampedModel):
    shop_id: str
    name: str
    location: str
    contact_email: EmailStr | None = None
    username: str | None = None
    alert_flags: dict[str, str] = Field(default_factory=dict)


class ShopCreateResponse(ShopResponse):
    """Returned only on creation — includes the one-time plain password."""
    plain_password: str | None = None
