from app.core.config import get_settings
from app.db.mongo import get_database
from app.models.base import utc_now
from app.schemas.distribution import (
    DistributedUnitResponse,
    DistributionCreate,
    DistributionListResponse,
    DistributionResponse,
    DistributionSummary,
)
from app.services.base import not_found
from app.services.stock_service import StockService
from app.utils.ids import generate_inventory_id, generate_qr_token, generate_serial_number


class DistributionService:
    def __init__(self) -> None:
        db = get_database()
        self.shops = db.shops
        self.products = db.products
        self.inventory = db.inventory
        self.qr_tokens = db.qr_tokens
        self.stock_service = StockService()

    async def distribute(self, payload: DistributionCreate) -> DistributionResponse:
        shop = await self.shops.find_one({"shop_id": payload.shop_id}, {"_id": 0})
        if not shop:
            raise not_found("Shop not found.")

        product = await self.products.find_one({"product_id": payload.product_id}, {"_id": 0})
        if not product:
            raise not_found("Product not found.")

        now = utc_now()
        settings = get_settings()
        units: list[DistributedUnitResponse] = []
        inventory_docs = []
        token_docs = []

        for _ in range(payload.quantity):
            inventory_id = generate_inventory_id()
            serial_number = generate_serial_number(payload.product_id)
            qr_token = generate_qr_token()

            inventory_docs.append(
                {
                    "inventory_id": inventory_id,
                    "shop_id": payload.shop_id,
                    "product_id": payload.product_id,
                    "serial_number": serial_number,
                    "status": "pending",
                    "distributed_at": now,
                    "sold_at": None,
                    "created_at": now,
                    "updated_at": now,
                }
            )
            token_docs.append(
                {
                    "token": qr_token,
                    "inventory_id": inventory_id,
                    "product_id": payload.product_id,
                    "shop_id": payload.shop_id,
                    "status": "active",
                    "created_at": now,
                    "updated_at": now,
                }
            )
            units.append(
                DistributedUnitResponse(
                    inventory_id=inventory_id,
                    serial_number=serial_number,
                    qr_token=qr_token,
                    qr_url=f"{settings.qr_base_url.rstrip('/')}/{qr_token}",
                    status="pending",
                    distributed_at=now,
                )
            )

        await self.inventory.insert_many(inventory_docs)
        await self.qr_tokens.insert_many(token_docs)
        await self.shops.update_one(
            {"shop_id": payload.shop_id},
            {
                "$set": {
                    "updated_at": now,
                    f"alert_flags.{payload.product_id}": "ok",
                }
            },
        )
        await self.stock_service.evaluate_stock_alert(payload.shop_id, payload.product_id)

        return DistributionResponse(
            shop_id=payload.shop_id,
            product_id=payload.product_id,
            quantity=payload.quantity,
            units=units,
        )

    async def get_distributions(self) -> DistributionListResponse:
        pipeline = [
            {
                "$group": {
                    "_id": {"shop_id": "$shop_id", "product_id": "$product_id"},
                    "total_units": {"$sum": 1},
                    "sold_units": {"$sum": {"$cond": [{"$eq": ["$status", "sold"]}, 1, 0]}},
                    "distributed_at": {"$max": "$distributed_at"},
                }
            },
            {
                "$lookup": {
                    "from": "shops",
                    "localField": "_id.shop_id",
                    "foreignField": "shop_id",
                    "as": "shop",
                }
            },
            {
                "$lookup": {
                    "from": "products",
                    "localField": "_id.product_id",
                    "foreignField": "product_id",
                    "as": "product",
                }
            },
            {"$unwind": "$shop"},
            {"$unwind": "$product"},
            {
                "$project": {
                    "_id": 0,
                    "shop_name": "$shop.name",
                    "product_name": "$product.product_name",
                    "total_units": 1,
                    "sold_units": 1,
                    "distributed_at": 1,
                }
            },
            {"$sort": {"distributed_at": -1}},
        ]
        items = []
        async for row in self.inventory.aggregate(pipeline):
            completion = (row["sold_units"] / row["total_units"] * 100) if row["total_units"] > 0 else 0
            items.append(
                DistributionSummary(
                    shop_name=row["shop_name"],
                    product_name=row["product_name"],
                    total_units=row["total_units"],
                    completion_percent=int(completion),
                    distributed_at=row["distributed_at"],
                )
            )
        return DistributionListResponse(items=items)
