import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_shops():
    uri = "mongodb+srv://oragantisagar041_db_user:ArahInfoTech123@cluster0.9x2n3ve.mongodb.net/?appName=Cluster0"
    db_name = "manufacturing_qr"
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print(f"Connecting to {db_name}...")
    shops = await db.shops.find({}, {"_id": 0, "name": 1, "username": 1}).to_list(length=100)
    print("Shops:")
    for shop in shops:
        print(f"Name: {shop.get('name')}, Username: {shop.get('username')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(get_shops())
