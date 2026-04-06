import uuid
from datetime import datetime, timezone
from re import sub


def slugify(value: str) -> str:
    normalized = sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return normalized or "item"


def generate_section_id(name: str) -> str:
    return f"SEC-{slugify(name).upper()}-{uuid.uuid4().hex[:6].upper()}"


def generate_shop_id(name: str) -> str:
    return f"SHP-{slugify(name).upper()}-{uuid.uuid4().hex[:6].upper()}"


def generate_inventory_id() -> str:
    return f"INV-{uuid.uuid4().hex.upper()}"


def generate_serial_number(product_id: str) -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    return f"SER-{product_id.upper()}-{timestamp}-{uuid.uuid4().hex[:8].upper()}"


def generate_qr_token() -> str:
    return uuid.uuid4().hex
