from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.database import connect_to_mongo, close_mongo_connection

# Esse gerenciador de contexto controla o que acontece quando o servidor liga e desliga
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo() # Liga o banco
    yield
    await close_mongo_connection() # Desliga o banco

app = FastAPI(
    title="Desafio do Dia API",
    description="API para gestão de turmas e desafios",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/")
def read_root():
    return {"mensagem": "A API do Desafio do Dia está online e operante!"}