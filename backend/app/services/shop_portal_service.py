from app.db.mongo import get_database
from app.services.base import not_found


class ShopPortalService:
    def __init__(self) -> None:
        db = get_database()
        self.shops = db.shops
        self.inventory = db.inventory
        self.products = db.products
        self.qr_tokens = db.qr_tokens

    async def get_shop_dashboard(self, shop_id: str) -> dict:
        shop = await self.shops.find_one({"shop_id": shop_id}, {"_id": 0})
        if not shop:
            raise not_found("Shop not found.")

        # Count totals
        total_stock = await self.inventory.count_documents({"shop_id": shop_id})
        pending = await self.inventory.count_documents({"shop_id": shop_id, "status": "pending"})
        sold = await self.inventory.count_documents({"shop_id": shop_id, "status": "sold"})

        # Unique products
        product_ids = await self.inventory.distinct("product_id", {"shop_id": shop_id})

        # Revenue (sum of sold item prices)
        revenue_pipeline = [
            {"$match": {"shop_id": shop_id, "status": "sold"}},
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
                "$group": {
                    "_id": None,
                    "total_revenue": {"$sum": {"$toDouble": "$product.total_price"}},
                }
            },
        ]
        revenue_result = [r async for r in self.inventory.aggregate(revenue_pipeline)]
        total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0

        # Recent sales (last 20)
        sales_pipeline = [
            {"$match": {"shop_id": shop_id, "status": "sold"}},
            {"$sort": {"sold_at": -1}},
            {"$limit": 20},
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
                "$project": {
                    "_id": 0,
                    "inventory_id": 1,
                    "product_id": 1,
                    "product_name": "$product.product_name",
                    "serial_number": 1,
                    "total_price": {"$toDouble": "$product.total_price"},
                    "sold_at": 1,
                }
            },
        ]
        recent_sales = [r async for r in self.inventory.aggregate(sales_pipeline)]

        return {
            "shop_id": shop["shop_id"],
            "shop_name": shop["name"],
            "location": shop["location"],
            "total_products": len(product_ids),
            "total_stock": total_stock,
            "pending_units": pending,
            "sold_units": sold,
            "total_revenue": total_revenue,
            "recent_sales": recent_sales,
        }

    async def get_sales_history(self, shop_id: str, page: int = 1, page_size: int = 30) -> dict:
        shop = await self.shops.find_one({"shop_id": shop_id}, {"_id": 0})
        if not shop:
            raise not_found("Shop not found.")

        match_filter = {"shop_id": shop_id, "status": "sold"}
        total = await self.inventory.count_documents(match_filter)
        skip = (page - 1) * page_size

        pipeline = [
            {"$match": match_filter},
            {"$sort": {"sold_at": -1}},
            {"$skip": skip},
            {"$limit": page_size},
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
                "$project": {
                    "_id": 0,
                    "inventory_id": 1,
                    "product_id": 1,
                    "product_name": "$product.product_name",
                    "serial_number": 1,
                    "total_price": {"$toDouble": "$product.total_price"},
                    "sold_at": 1,
                }
            },
        ]
        items = [r async for r in self.inventory.aggregate(pipeline)]

        from math import ceil

        return {
            "items": items,
            "meta": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": ceil(total / page_size) if total else 0,
            },
        }
