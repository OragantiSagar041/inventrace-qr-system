from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import require_admin_token
from app.schemas.common import PaginatedResponse
from app.schemas.section import SectionCreate, SectionResponse
from app.services.section_service import SectionService

router = APIRouter(prefix="/sections", tags=["Sections"])


@router.post(
    "",
    response_model=SectionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin_token)],
)
async def create_section(payload: SectionCreate) -> SectionResponse:
    return await SectionService().create_section(payload)


@router.get("", response_model=PaginatedResponse[SectionResponse])
async def list_sections(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[SectionResponse]:
    return await SectionService().list_sections(page, page_size)
