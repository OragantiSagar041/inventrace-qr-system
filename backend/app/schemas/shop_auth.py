from pydantic import BaseModel


class ShopLoginRequest(BaseModel):
    username: str
    password: str


class ShopLoginResponse(BaseModel):
    token: str
    shop_id: str
    shop_name: str
    location: str


class ShopMeResponse(BaseModel):
    shop_id: str
    name: str
    location: str
    contact_email: str | None = None
