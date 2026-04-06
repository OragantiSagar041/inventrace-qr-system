from app.db.mongo import get_database
from app.models.base import utc_now
from app.services.base import conflict, not_found
from app.services.stock_service import StockService


class CustomerService:
    def __init__(self) -> None:
        db = get_database()
        self.qr_tokens = db.qr_tokens
        self.inventory = db.inventory
        self.products = db.products
        self.shops = db.shops
        self.sections = db.sections
        self.stock_service = StockService()

    async def get_product_by_token(self, token: str) -> dict:
        """Get product info for a QR token (customer view)."""
        qr_record = await self.qr_tokens.find_one({"token": token}, {"_id": 0})
        if not qr_record:
            raise not_found("QR code not found. This may not be a valid product code.")

        inventory = await self.inventory.find_one(
            {"inventory_id": qr_record["inventory_id"]}, {"_id": 0}
        )
        if not inventory:
            raise not_found("Product unit not found.")

        product = await self.products.find_one(
            {"product_id": inventory["product_id"]}, {"_id": 0}
        )
        if not product:
            raise not_found("Product details not found.")

        shop = await self.shops.find_one(
            {"shop_id": inventory["shop_id"]}, {"_id": 0}
        )

        # Get section name
        section = await self.sections.find_one(
            {"section_id": product.get("section_id", "")}, {"_id": 0}
        )

        status = "available" if inventory["status"] == "pending" else "sold"

        return {
            "token": token,
            "product_id": product["product_id"],
            "product_name": product["product_name"],
            "total_price": float(product["total_price"]),
            "shop_id": shop["shop_id"] if shop else "",
            "shop_name": shop["name"] if shop else "Unknown",
            "shop_location": shop["location"] if shop else "",
            "status": status,
            "section_name": section["name"] if section else None,
        }

    async def buy_product(self, token: str) -> dict:
        """Complete a purchase by QR token."""
        qr_record = await self.qr_tokens.find_one({"token": token}, {"_id": 0})
        if not qr_record:
            raise not_found("QR code not found.")

        if qr_record["status"] != "active":
            raise conflict("This product has already been sold.")

        inventory = await self.inventory.find_one(
            {"inventory_id": qr_record["inventory_id"]}, {"_id": 0}
        )
        if not inventory:
            raise not_found("Product unit not found.")

        if inventory["status"] == "sold":
            raise conflict("This product has already been sold.")

        product = await self.products.find_one(
            {"product_id": inventory["product_id"]}, {"_id": 0}
        )
        shop = await self.shops.find_one(
            {"shop_id": inventory["shop_id"]}, {"_id": 0}
        )

        sold_at = utc_now()

        # Mark inventory as sold
        await self.inventory.update_one(
            {"inventory_id": inventory["inventory_id"]},
            {"$set": {"status": "sold", "sold_at": sold_at, "updated_at": sold_at}},
        )

        # Mark QR token as used
        await self.qr_tokens.update_one(
            {"token": token},
            {"$set": {"status": "used", "updated_at": sold_at}},
        )

        # Evaluate stock alert
        await self.stock_service.evaluate_stock_alert(
            inventory["shop_id"], inventory["product_id"]
        )

        return {
            "success": True,
            "message": "Purchase completed successfully!",
            "product_name": product["product_name"] if product else "Unknown",
            "serial_number": inventory["serial_number"],
            "shop_name": shop["name"] if shop else "Unknown",
            "total_price": float(product["total_price"]) if product else 0,
            "sold_at": sold_at,
        }
