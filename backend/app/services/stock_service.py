import logging

from app.core.config import get_settings
from app.db.mongo import get_database
from app.models.base import utc_now
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


class StockService:
    def __init__(self) -> None:
        db = get_database()
        self.inventory = db.inventory
        self.shops = db.shops
        self.products = db.products
        self.email_service = EmailService()

    async def evaluate_stock_alert(self, shop_id: str, product_id: str) -> None:
        settings = get_settings()
        pending_stock = await self.inventory.count_documents(
            {"shop_id": shop_id, "product_id": product_id, "status": "pending"}
        )
        shop = await self.shops.find_one({"shop_id": shop_id}, {"_id": 0})
        product = await self.products.find_one({"product_id": product_id}, {"_id": 0})
        if not shop or not product:
            return

        current_flag = (shop.get("alert_flags") or {}).get(product_id, "ok")
        if pending_stock == 0:
            new_flag = "out"
        elif pending_stock <= settings.low_stock_threshold:
            new_flag = "low"
        else:
            new_flag = "ok"

        if current_flag == new_flag:
            return

        await self.shops.update_one(
            {"shop_id": shop_id},
            {
                "$set": {
                    f"alert_flags.{product_id}": new_flag,
                    "updated_at": utc_now(),
                }
            },
        )

        if new_flag in {"low", "out"}:
            try:
                await self.email_service.send_stock_alert(
                    shop_name=shop["name"],
                    product_name=product["product_name"],
                    available_stock=pending_stock,
                    alert_type=new_flag,
                )
            except Exception:
                logger.exception("Failed to send stock alert email.")
