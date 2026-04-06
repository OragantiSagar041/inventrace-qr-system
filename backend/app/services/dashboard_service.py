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

        return DashboardResponse(
            total_products=total_products,
            total_sections=total_sections,
            total_shops=total_shops,
            total_inventory_units=total_inventory_units,
            sold_units=sold_units,
            pending_units=pending_units,
            stock_per_shop=sorted(stock_per_shop, key=lambda item: item.shop_name.lower()),
            alerts=sorted(alerts, key=lambda item: (item.alert_type, item.shop_name.lower(), item.product_name.lower())),
        )
