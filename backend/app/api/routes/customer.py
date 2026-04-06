from fastapi import APIRouter

from app.schemas.customer import CustomerBuyResponse, CustomerProductView
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customer", tags=["Customer"])


@router.get("/product/{token}", response_model=CustomerProductView)
async def get_product_info(token: str) -> CustomerProductView:
    """Public endpoint: customer scans QR to see product info."""
    return await CustomerService().get_product_by_token(token)


@router.post("/buy/{token}", response_model=CustomerBuyResponse)
async def buy_product(token: str) -> CustomerBuyResponse:
    """Public endpoint: customer clicks Buy to complete a purchase."""
    return await CustomerService().buy_product(token)
