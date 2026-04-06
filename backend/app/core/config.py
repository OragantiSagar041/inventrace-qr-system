from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="Manufacturing QR Inventory API", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    mongodb_uri: str = Field(alias="MONGODB_URI")
    mongodb_db: str = Field(default="manufacturing_qr", alias="MONGODB_DB")
    brevo_api_key: str | None = Field(default=None, alias="BREVO_API_KEY")
    brevo_sender_email: str = Field(default="no-reply@example.com", alias="BREVO_SENDER_EMAIL")
    brevo_sender_name: str = Field(default="Manufacturing Inventory", alias="BREVO_SENDER_NAME")
    admin_alert_email: str = Field(default="admin@example.com", alias="ADMIN_ALERT_EMAIL")
    admin_token: str | None = Field(default=None, alias="ADMIN_TOKEN")
    qr_base_url: str = Field(default="http://localhost:8000/scan", alias="QR_BASE_URL")
    low_stock_threshold: int = 3

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
