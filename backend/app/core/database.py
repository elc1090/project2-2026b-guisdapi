from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str
    DATABASE_NAME: str
    SECRET_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def connect_to_mongo():
    print("⏳ Conectando ao MongoDB...")
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    print("✅ Conectado ao MongoDB com sucesso!")

async def close_mongo_connection():
    if db.client is not None:
        db.client.close()
        print("🛑 Conexão com MongoDB encerrada.")

def get_database():
    return db.client[settings.DATABASE_NAME]