from fastapi import APIRouter, Depends

from app.api.dependencies import require_admin_token
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/admin", response_model=DashboardResponse, dependencies=[Depends(require_admin_token)])
async def get_admin_dashboard() -> DashboardResponse:
    return await DashboardService().get_admin_dashboard()
