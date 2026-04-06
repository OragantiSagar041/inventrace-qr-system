from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import require_admin_token
from app.schemas.common import PaginatedResponse
from app.schemas.product import ProductCreate, ProductResponse
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin_token)],
)
async def create_product(payload: ProductCreate) -> ProductResponse:
    return await ProductService().create_product(payload)


@router.get("", response_model=PaginatedResponse[ProductResponse])
async def list_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[ProductResponse]:
    return await ProductService().list_products(page, page_size)
