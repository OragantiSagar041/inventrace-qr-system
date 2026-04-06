from fastapi import APIRouter

from app.schemas.qr import QRScanResponse
from app.services.qr_service import QRService

router = APIRouter(tags=["QR"])


@router.get("/scan/{token}", response_model=QRScanResponse)
async def scan_product(token: str) -> QRScanResponse:
    return await QRService().scan_and_sell(token)
