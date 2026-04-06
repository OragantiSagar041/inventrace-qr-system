from app.db.mongo import get_database
from app.schemas.dashboard import AlertSummary, DashboardResponse, ShopStockSummary


class DashboardService:
    def __init__(self) -> None:
        db = get_database()
        self.sections = db.sections
        self.products = db.products
        self.shops = db.shops
        self.inventory = db.inventory

    async def get_admin_dashboard(self) -> DashboardResponse:
        total_products = await self.products.count_documents({})
        total_sections = await self.sections.count_documents({})
        total_shops = await self.shops.count_documents({})
        total_inventory_units = await self.inventory.count_documents({})
        sold_units = await self.inventory.count_documents({"status": "sold"})
        pending_units = await self.inventory.count_documents({"status": "pending"})

        stock_pipeline = [
            {
                "$group": {
                    "_id": {"shop_id": "$shop_id", "status": "$status"},
                    "count": {"$sum": 1},
                }
            },
            {
                "$group": {
                    "_id": "$_id.shop_id",
                    "counts": {"$push": {"status": "$_id.status", "count": "$count"}},
                }
            },
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
                    "shop_name": "$shop.name",
                    "counts": 1,
                }
            },
        ]
        stock_per_shop = []
        async for row in self.inventory.aggregate(stock_pipeline):
            counts = {item["status"]: item["count"] for item in row["counts"]}
            stock_per_shop.append(
                ShopStockSummary(
                    shop_id=row["shop_id"],
                    shop_name=row["shop_name"],
                    pending_stock=counts.get("pending", 0),
                    sold_stock=counts.get("sold", 0),
                )
            )

        shops = [shop async for shop in self.shops.find({}, {"_id": 0, "shop_id": 1, "name": 1, "alert_flags": 1})]
        known_shop_ids = {item.shop_id for item in stock_per_shop}
        for shop in shops:
            if shop["shop_id"] in known_shop_ids:
                continue
            stock_per_shop.append(
                ShopStockSummary(
                    shop_id=shop["shop_id"],
                    shop_name=shop["name"],
                    pending_stock=0,
                    sold_stock=0,
                )
            )
        product_map = {
            product["product_id"]: product["product_name"]
            async for product in self.products.find({}, {"_id": 0, "product_id": 1, "product_name": 1})
        }
        alerts = []
        for shop in shops:
            for product_id, flag in (shop.get("alert_flags") or {}).items():
                if flag not in {"low", "out"}:
                    continue
                available_stock = await self.inventory.count_documents(
                    {"shop_id": shop["shop_id"], "product_id": product_id, "status": "pending"}
                )
                alerts.append(
                    AlertSummary(
                        shop_id=shop["shop_id"],
                        shop_name=shop["name"],
                        product_id=product_id,
                        product_name=product_map.get(product_id, "Unknown Product"),
                        available_stock=available_stock,
                        alert_type=flag,
                    )
                )

        # --- Grouped Daily Sales (Last 15 Days) ---
        from datetime import timedelta
        from app.models.base import utc_now
        from collections import defaultdict
        
        window = utc_now() - timedelta(days=30) # Window for last 30 days
        pipeline = [
            {"$match": {"status": "sold", "sold_at": {"$gte": window}}},
            {
                "$lookup": {
                    "from": "products",
                    "localField": "product_id",
                    "foreignField": "product_id",
                    "as": "prod"
                }
            },
            {"$unwind": "$prod"},
            {
                "$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$sold_at"}},
                        "shop_id": "$shop_id"
                    },
                    "count": {"$sum": 1},
                    "revenue": {"$sum": "$prod.total_price"}
                }
            },
            {"$sort": {"_id.date": 1}}
        ]
        
        daily_map = defaultdict(lambda: {"overall": 0, "overall_revenue": 0})
        async for r in self.inventory.aggregate(pipeline):
            date = r["_id"]["date"]
            shop_id = r["_id"]["shop_id"]
            count = r["count"]
            rev = r["revenue"]
            
            daily_map[date]["date"] = date
            daily_map[date]["overall"] += count
            daily_map[date]["overall_revenue"] += rev
            daily_map[date][shop_id] = count
            daily_map[date][f"{shop_id}_revenue"] = rev

        chart_data = sorted(daily_map.values(), key=lambda x: x["date"])

        # --- Product Popularity (Top 5) ---
        pop_pipeline = [
            {"$match": {"status": "sold"}},
            {"$group": {"_id": "$product_id", "sold_count": {"$sum": 1}}},
            {"$sort": {"sold_count": -1}},
            {"$limit": 5},
            {"$lookup": {"from": "products", "localField": "_id", "foreignField": "product_id", "as": "p"}},
            {"$unwind": "$p"},
            {"$project": {"_id": 0, "name": "$p.product_name", "value": "$sold_count"}}
        ]
        popularity = [p async for p in self.inventory.aggregate(pop_pipeline)]

        # --- Enhanced Alerts with Forecast ---
        # Calculate daily sale rate per shop/product for the last 7 days
        seven_days_ago = utc_now() - timedelta(days=7)
        rate_pipeline = [
            {"$match": {"status": "sold", "sold_at": {"$gte": seven_days_ago}}},
            {"$group": {"_id": {"shop_id": "$shop_id", "product_id": "$product_id"}, "count": {"$sum": 1}}}
        ]
        rates = {}
        async for r in self.inventory.aggregate(rate_pipeline):
            key = f"{r['_id']['shop_id']}_{r['_id']['product_id']}"
            rates[key] = r["count"] / 7.0

        for alert in alerts:
            key = f"{alert.shop_id}_{alert.product_id}"
            rate = rates.get(key, 0)
            if rate > 0 and alert.available_stock > 0:
                alert.forecast = f"Stock out in ~{int(alert.available_stock / rate)} days"
            elif alert.available_stock == 0:
                alert.forecast = "Urgent: Refill Required"
            else:
                alert.forecast = "Low velocity"

        # --- Recent Sales ---
        recent_sales_pipeline = [
            {"$match": {"status": "sold"}},
            {"$sort": {"sold_at": -1}},
            {"$limit": 15},
            {"$lookup": {"from": "products", "localField": "product_id", "foreignField": "product_id", "as": "product"}},
            {"$unwind": "$product"},
            {
                "$project": {
                    "_id": 0, "inventory_id": 1, "serial_number": 1, "shop_id": 1, 
                    "sold_at": 1, "total_price": "$product.total_price", "product_name": "$product.product_name"
                }
            }
        ]
        recent_sales = [r async for r in self.inventory.aggregate(recent_sales_pipeline)]

        return DashboardResponse(
            total_products=total_products,
            total_sections=total_sections,
            total_shops=total_shops,
            total_inventory_units=total_inventory_units,
            sold_units=sold_units,
            pending_units=pending_units,
            stock_per_shop=sorted(stock_per_shop, key=lambda item: item.shop_name.lower()),
            alerts=sorted(alerts, key=lambda item: (item.alert_type, item.shop_name.lower(), item.product_name.lower())),
            chart_data=chart_data,
            recent_sales=recent_sales,
            popularity=popularity
        )
