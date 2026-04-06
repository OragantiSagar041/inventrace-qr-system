from pydantic import BaseModel


class ShopStockSummary(BaseModel):
    shop_id: str
    shop_name: str
    pending_stock: int
    sold_stock: int


class AlertSummary(BaseModel):
    shop_id: str
    shop_name: str
    product_id: str
    product_name: str
    available_stock: int
    alert_type: str
    forecast: str = ""


class DashboardResponse(BaseModel):
    total_products: int
    total_sections: int
    total_shops: int
    total_inventory_units: int
    sold_units: int
    pending_units: int
    stock_per_shop: list[ShopStockSummary]
    alerts: list[AlertSummary]
    chart_data: list[dict] = []  # [{ "date": "...", "overall": 10, "shop_id_1": 5, ... }]
    recent_sales: list[dict] = []
    popularity: list[dict] = []
