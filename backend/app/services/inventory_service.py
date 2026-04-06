from collections import defaultdict

from app.db.mongo import get_database
from app.schemas.inventory import (
    InventorySectionGroup,
    InventoryUnitResponse,
    ProductAvailabilityResponse,
    ShopInventoryResponse,
)
from app.services.base import not_found


class InventoryService:
    def __init__(self) -> None:
        db = get_database()
        self.shops = db.shops
        self.inventory = db.inventory
        self.qr_tokens = db.qr_tokens

    async def get_shop_inventory(self, shop_id: str) -> ShopInventoryResponse:
        shop = await self.shops.find_one({"shop_id": shop_id}, {"_id": 0})
        if not shop:
            raise not_found("Shop not found.")

        pipeline = [
            {"$match": {"shop_id": shop_id}},
            {
                "$lookup": {
                    "from": "products",
                    "localField": "product_id",
                    "foreignField": "product_id",
                    "as": "product",
                }
            },
            {"$unwind": "$product"},
            {
                "$lookup": {
                    "from": "sections",
                    "localField": "product.section_id",
                    "foreignField": "section_id",
                    "as": "section",
                }
            },
            {"$unwind": "$section"},
            {
                "$project": {
                    "_id": 0,
                    "inventory_id": 1,
                    "product_id": 1,
                    "serial_number": 1,
                    "status": 1,
                    "distributed_at": 1,
                    "sold_at": 1,
                    "product_name": "$product.product_name",
                    "total_price": "$product.total_price",
                    "section_id": "$section.section_id",
                    "section_name": "$section.name",
                }
            },
        ]
        rows = [row async for row in self.inventory.aggregate(pipeline)]
        token_map = await self._token_map_for_inventory([row["inventory_id"] for row in rows])

        grouped: dict[tuple[str, str], list[InventoryUnitResponse]] = defaultdict(list)
        for row in rows:
            grouped[(row["section_id"], row["section_name"])].append(
                InventoryUnitResponse(
                    inventory_id=row["inventory_id"],
                    product_id=row["product_id"],
                    product_name=row["product_name"],
                    serial_number=row["serial_number"],
                    qr_token=token_map.get(row["inventory_id"], ""),
                    status=row["status"],
                    distributed_at=row["distributed_at"],
                    sold_at=row.get("sold_at"),
                    total_price=row["total_price"],
                )
            )

        sections = []
        for (section_id, section_name), items in grouped.items():
            pending = sum(1 for item in items if item.status == "pending")
            completed = sum(1 for item in items if item.status == "sold")
            items.sort(key=lambda item: (item.status, item.product_name, item.serial_number))
            sections.append(
                InventorySectionGroup(
                    section_id=section_id,
                    section_name=section_name,
                    completed=completed,
                    pending=pending,
                    items=items,
                )
            )

        sections.sort(key=lambda section: section.section_name.lower())
        return ShopInventoryResponse(
            shop_id=shop["shop_id"],
            shop_name=shop["name"],
            location=shop["location"],
            sections=sections,
        )

    async def customer_check(self, shop_id: str, product_id: str) -> ProductAvailabilityResponse:
        shop = await self.shops.find_one({"shop_id": shop_id}, {"_id": 0})
        if not shop:
            raise not_found("Shop not found.")

        available_count = await self.inventory.count_documents(
            {"shop_id": shop_id, "product_id": product_id, "status": "pending"}
        )
        if available_count > 0:
            return ProductAvailabilityResponse(
                product_id=product_id,
                requested_shop_id=shop_id,
                available=True,
                message="Stock available. Sale can proceed.",
                alternative_shops=[],
            )

        pipeline = [
            {"$match": {"product_id": product_id, "status": "pending", "shop_id": {"$ne": shop_id}}},
            {"$group": {"_id": "$shop_id", "available_stock": {"$sum": 1}}},
            {
                "$lookup": {
                    "from": "shops",
                    "localField": "_id",
                    "foreignField": "shop_id",
                    "as": "shop",
                }
            },
            {"$unwind": "$shop"},
            {
                "$project": {
                    "_id": 0,
                    "shop_id": "$shop.shop_id",
                    "name": "$shop.name",
                    "location": "$shop.location",
                    "available_stock": 1,
                }
            },
            {"$sort": {"available_stock": -1, "name": 1}},
        ]
        alternatives = [row async for row in self.inventory.aggregate(pipeline)]
        return ProductAvailabilityResponse(
            product_id=product_id,
            requested_shop_id=shop_id,
            available=False,
            message="Stock is over, it will come soon",
            alternative_shops=alternatives,
        )

    async def _token_map_for_inventory(self, inventory_ids: list[str]) -> dict[str, str]:
        if not inventory_ids:
            return {}
        cursor = self.qr_tokens.find(
            {"inventory_id": {"$in": inventory_ids}},
            {"_id": 0, "inventory_id": 1, "token": 1},
        )
        return {row["inventory_id"]: row["token"] async for row in cursor}
