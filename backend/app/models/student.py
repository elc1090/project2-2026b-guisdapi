from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

# define o esquema de entrada para o primeiro acesso do aluno
class StudentCreate(BaseModel):
    name: str = Field(..., min_length=3, description="nome completo do aluno")
    matricula: str = Field(..., min_length=5, description="numero de matricula institucional")
    classroom_code: str = Field(..., description="codigo de convite da turma gerado pelo professor")
    pin: str = Field(..., min_length=4, max_length=4, description="senha numerica de 4 digitos")

# define o esquema de saida retornado ao frontend
class StudentResponse(BaseModel):
    id: str
    name: str
    matricula: str
    classroom_id: str
    streak: int = 0
    last_submission_date: Optional[date] = None

# define o esquema de saida para o ranking da turma (esconde dados sensiveis)
class StudentRankingResponse(BaseModel):
    name: str
    score: int = 0
    streak: int = 0

    class Config:
        populate_by_name = True