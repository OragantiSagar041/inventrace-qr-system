from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | None = None


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    global client, database
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    database = client[settings.mongodb_db]
    await ensure_indexes()
    yield
    client.close()


def get_database() -> AsyncIOMotorDatabase:
    if database is None:
        raise RuntimeError("Database has not been initialized.")
    return database


async def ensure_indexes() -> None:
    db = get_database()
    await db.sections.create_index("section_id", unique=True)
    await db.sections.create_index("name", unique=True)
    await db.products.create_index("product_id", unique=True)
    await db.products.create_index("section_id")
    await db.shops.create_index("shop_id", unique=True)
    await db.shops.create_index([(("name", 1)), ("location", 1)], unique=True)
    await db.shops.create_index("username", unique=True, sparse=True)
    await db.inventory.create_index("inventory_id", unique=True)
    await db.inventory.create_index("serial_number", unique=True)
    await db.inventory.create_index([("shop_id", 1), ("product_id", 1), ("status", 1)])
    await db.qr_tokens.create_index("token", unique=True)
    await db.qr_tokens.create_index("inventory_id", unique=True)
