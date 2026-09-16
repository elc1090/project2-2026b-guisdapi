import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routes import teachers, auth, classrooms, students, challenges, submissions

# esse gerenciador de contexto controla o que acontece quando o servidor liga e desliga
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

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Configuração do CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        FRONTEND_URL # Aqui entra o link da sua Vercel no futuro!
    ], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

#inclusão das rotas
app.include_router(teachers.router)
app.include_router(auth.router)
app.include_router(classrooms.router)
app.include_router(students.router)
app.include_router(challenges.router)
app.include_router(submissions.router)

@app.get("/")
def read_root():
    return {"mensagem": "A API do Desafio do Dia está online e operante!"}