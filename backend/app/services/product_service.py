from decimal import Decimal, ROUND_HALF_UP

from pymongo.errors import DuplicateKeyError

from app.db.mongo import get_database
from app.models.base import utc_now
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.product import ProductCreate, ProductResponse
from app.services.base import conflict, not_found


class ProductService:
    def __init__(self) -> None:
        db = get_database()
        self.products = db.products
        self.sections = db.sections

    async def create_product(self, payload: ProductCreate) -> ProductResponse:
        section = await self.sections.find_one({"section_id": payload.section_id}, {"_id": 0})
        if not section:
            raise not_found("Section not found.")

        total_price = self._compute_total_price(payload.base_price, payload.cgst, payload.sgst)
        now = utc_now()
        document = {
            "product_id": payload.product_id,
            "product_name": payload.product_name.strip(),
            "section_id": payload.section_id,
            "base_price": float(payload.base_price),
            "cgst": float(payload.cgst),
            "sgst": float(payload.sgst),
            "total_price": float(total_price),
            "created_at": now,
            "updated_at": now,
        }
        try:
            await self.products.insert_one(document)
        except DuplicateKeyError as exc:
            raise conflict("Product ID already exists.") from exc
        return ProductResponse(**document)

    async def list_products(self, page: int, page_size: int) -> PaginatedResponse[ProductResponse]:
        skip = (page - 1) * page_size
        total = await self.products.count_documents({})
        cursor = self.products.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(page_size)
        items = [ProductResponse(**item) async for item in cursor]
        return PaginatedResponse(items=items, meta=PaginationMeta.build(page, page_size, total))

    @staticmethod
    def _compute_total_price(base_price: Decimal, cgst: Decimal, sgst: Decimal) -> Decimal:
        total_tax = (base_price * cgst / Decimal("100")) + (base_price * sgst / Decimal("100"))
        return (base_price + total_tax).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
