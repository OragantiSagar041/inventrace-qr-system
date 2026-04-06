from app.db.mongo import get_database
from app.models.base import utc_now
from app.schemas.qr import QRScanResponse
from app.services.base import conflict, not_found
from app.services.stock_service import StockService


class QRService:
    def __init__(self) -> None:
        db = get_database()
        self.qr_tokens = db.qr_tokens
        self.inventory = db.inventory
        self.stock_service = StockService()

    async def scan_and_sell(self, token: str) -> QRScanResponse:
        qr_record = await self.qr_tokens.find_one({"token": token}, {"_id": 0})
        if not qr_record:
            raise not_found("QR token not found.")
        if qr_record["status"] != "active":
            raise conflict("This QR code has already been used.")

        inventory_record = await self.inventory.find_one({"inventory_id": qr_record["inventory_id"]}, {"_id": 0})
        if not inventory_record:
            raise not_found("Inventory item not found.")
        if inventory_record["status"] == "sold":
            raise conflict("This product unit is already sold.")

        sold_at = utc_now()
        await self.inventory.update_one(
            {"inventory_id": inventory_record["inventory_id"]},
            {"$set": {"status": "sold", "sold_at": sold_at, "updated_at": sold_at}},
        )
        await self.qr_tokens.update_one(
            {"token": token},
            {"$set": {"status": "used", "updated_at": sold_at}},
        )
        await self.stock_service.evaluate_stock_alert(qr_record["shop_id"], qr_record["product_id"])

        return QRScanResponse(
            token=token,
            inventory_id=inventory_record["inventory_id"],
            product_id=inventory_record["product_id"],
            shop_id=inventory_record["shop_id"],
            status="sold",
            message="Product scanned successfully. Sale completed.",
            sold_at=sold_at,
        )
