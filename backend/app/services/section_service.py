from pymongo.errors import DuplicateKeyError

from app.db.mongo import get_database
from app.models.base import utc_now
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.section import SectionCreate, SectionResponse
from app.services.base import conflict
from app.utils.ids import generate_section_id


class SectionService:
    def __init__(self) -> None:
        self.collection = get_database().sections

    async def create_section(self, payload: SectionCreate) -> SectionResponse:
        now = utc_now()
        document = {
            "section_id": generate_section_id(payload.name),
            "name": payload.name.strip(),
            "description": payload.description,
            "created_at": now,
            "updated_at": now,
        }
        try:
            await self.collection.insert_one(document)
        except DuplicateKeyError as exc:
            raise conflict("Section already exists.") from exc
        return SectionResponse(**document)

    async def list_sections(self, page: int, page_size: int) -> PaginatedResponse[SectionResponse]:
        skip = (page - 1) * page_size
        total = await self.collection.count_documents({})
        cursor = self.collection.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(page_size)
        items = [SectionResponse(**item) async for item in cursor]
        return PaginatedResponse(items=items, meta=PaginationMeta.build(page, page_size, total))
