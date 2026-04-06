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

        # --- NEW: Daily Sales (Last 7 Days) for Chart ---
        from datetime import timedelta
        from app.models.base import utc_now
        seven_days_ago = utc_now() - timedelta(days=7)
        
        daily_pipeline = [
            {"$match": {"shop_id": shop_id, "status": "sold", "sold_at": {"$gte": seven_days_ago}}},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$sold_at"}},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        daily_data = [
            {"date": r["_id"], "count": r["count"]} 
            async for r in self.inventory.aggregate(daily_pipeline)
        ]

        # --- NEW: Out of Stock Alerts + Cross-Location Suggestions ---
        alerts = []
        for p_id in product_ids:
            # Check current shop's pending stock for this product
            has_stock = await self.inventory.find_one({
                "shop_id": shop_id,
                "product_id": p_id,
                "status": "pending"
            })

            if not has_stock:
                # 1. Get product name
                product_meta = await self.products.find_one({"product_id": p_id}, {"product_name": 1})
                p_name = product_meta["product_name"] if product_meta else "Product"

                # 2. Find other shops where it IS available
                other_shops_with_stock = []
                other_shops_pipeline = [
                    {"$match": {"product_id": p_id, "status": "pending", "shop_id": {"$ne": shop_id}}},
                    {"$group": {"_id": "$shop_id"}},
                    {
                        "$lookup": {
                            "from": "shops",
                            "localField": "_id",
                            "foreignField": "shop_id",
                            "as": "shop_info"
                        }
                    },
                    {"$unwind": "$shop_info"},
                    {"$project": {"_id": 0, "name": "$shop_info.name", "location": "$shop_info.location"}}
                ]
                async for row in self.inventory.aggregate(other_shops_pipeline):
                    other_shops_with_stock.append(f"{row['name']} ({row['location']})")

                alerts.append({
                    "product_name": p_name,
                    "product_id": p_id,
                    "available_at": other_shops_with_stock
                })

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
            "daily_sales": daily_data,
            "alerts": alerts
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
