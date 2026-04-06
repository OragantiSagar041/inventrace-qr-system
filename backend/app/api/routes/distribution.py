from fastapi import APIRouter, Depends, status

from app.api.dependencies import require_admin_token
from app.schemas.distribution import DistributionCreate, DistributionResponse
from app.services.distribution_service import DistributionService

router = APIRouter(prefix="/distribute", tags=["Distribution"])


from app.schemas.distribution import DistributionCreate, DistributionResponse, DistributionListResponse


@router.post(
    "",
    response_model=DistributionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin_token)],
)
async def distribute(payload: DistributionCreate) -> DistributionResponse:
    return await DistributionService().distribute(payload)


@router.get(
    "",
    response_model=DistributionListResponse,
    dependencies=[Depends(require_admin_token)],
)
async def list_distributions() -> DistributionListResponse:
    return await DistributionService().get_distributions()
