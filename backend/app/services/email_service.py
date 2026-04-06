import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmailService:
    BREVO_URL = "https://api.brevo.com/v3/smtp/email"

    async def send_stock_alert(
        self,
        *,
        shop_name: str,
        product_name: str,
        available_stock: int,
        alert_type: str,
    ) -> None:
        settings = get_settings()
        if not settings.brevo_api_key:
            logger.warning("BREVO_API_KEY is not configured. Skipping alert email.")
            return

        subject = "Out of Stock Alert" if alert_type == "out" else "Low Stock Alert"
        body = (
            f"Shop: {shop_name}\n"
            f"Product: {product_name}\n"
            f"Available Stock: {available_stock}\n"
            f"Alert Type: {alert_type}\n"
        )
        payload = {
            "sender": {
                "email": settings.brevo_sender_email,
                "name": settings.brevo_sender_name,
            },
            "to": [{"email": settings.admin_alert_email}],
            "subject": subject,
            "textContent": body,
        }
        headers = {
            "accept": "application/json",
            "api-key": settings.brevo_api_key,
            "content-type": "application/json",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(self.BREVO_URL, json=payload, headers=headers)
            response.raise_for_status()
            logger.info(
                "Sent %s stock alert email for %s at %s.",
                alert_type,
                product_name,
                shop_name,
            )
