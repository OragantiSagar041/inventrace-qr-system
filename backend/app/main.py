from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.customer import router as customer_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.distribution import router as distribution_router
from app.api.routes.inventory import router as inventory_router
from app.api.routes.products import router as product_router
from app.api.routes.qr import router as qr_router
from app.api.routes.sections import router as section_router
from app.api.routes.shop_portal import router as shop_portal_router
from app.api.routes.shops import router as shop_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.mongo import lifespan

configure_logging()
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth
app.include_router(auth_router)

# Admin
app.include_router(section_router)
app.include_router(product_router)
app.include_router(shop_router)
app.include_router(distribution_router)
app.include_router(qr_router)
app.include_router(inventory_router)
app.include_router(dashboard_router)

# Shop Portal
app.include_router(shop_portal_router)

# Customer
app.include_router(customer_router)


@app.get("/", tags=["Health"])
async def root() -> dict[str, str]:
    return {"message": f"{settings.app_name} is running."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
