from pymongo.errors import DuplicateKeyError

from app.db.mongo import get_database
from app.models.base import utc_now
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.shop import ShopCreate, ShopCreateResponse, ShopResponse
from app.services.auth_service import generate_shop_password, hash_password
from app.services.base import conflict
from app.utils.ids import generate_shop_id


def _make_username(name: str) -> str:
    """Generate a username from the shop name."""
    slug = name.strip().lower().replace(" ", "_")
    # Remove non-alphanumeric chars except underscore
    slug = "".join(c for c in slug if c.isalnum() or c == "_")
    return slug or "shop"


class ShopService:
    def __init__(self) -> None:
        self.collection = get_database().shops

    async def create_shop(self, payload: ShopCreate) -> ShopCreateResponse:
        now = utc_now()
        plain_password = payload.password
        username = _make_username(payload.name)

        # Ensure username is unique
        existing = await self.collection.find_one({"username": username})
        if existing:
            import uuid
            username = f"{username}_{uuid.uuid4().hex[:4]}"

        document = {
            "shop_id": generate_shop_id(payload.name),
            "name": payload.name.strip(),
            "location": payload.location.strip(),
            "contact_email": payload.contact_email,
            "username": username,
            "password_hash": hash_password(plain_password),
            "alert_flags": {},
            "created_at": now,
            "updated_at": now,
        }
        try:
            await self.collection.insert_one(document)
        except DuplicateKeyError as exc:
            raise conflict("Shop already exists.") from exc
        return ShopCreateResponse(**document, plain_password=plain_password)

    async def list_shops(self, page: int, page_size: int) -> PaginatedResponse[ShopResponse]:
        skip = (page - 1) * page_size
        total = await self.collection.count_documents({})
        cursor = self.collection.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(skip).limit(page_size)
        items = [ShopResponse(**item) async for item in cursor]
        return PaginatedResponse(items=items, meta=PaginationMeta.build(page, page_size, total))

    async def get_shop_by_id(self, shop_id: str) -> ShopResponse | None:
        doc = await self.collection.find_one({"shop_id": shop_id}, {"_id": 0, "password_hash": 0})
        return ShopResponse(**doc) if doc else None

    async def reset_credentials(self, shop_id: str, plain_password: str) -> dict:
        """Reset the login credentials for a shop."""
        shop = await self.collection.find_one({"shop_id": shop_id}, {"_id": 0})
        if not shop:
            return None
        
        username = shop.get("username") or _make_username(shop["name"])
        await self.collection.update_one(
            {"shop_id": shop_id},
            {
                "$set": {
                    "username": username,
                    "password_hash": hash_password(plain_password),
                    "updated_at": utc_now(),
                }
            },
        )
        return {"username": username, "plain_password": plain_password}
