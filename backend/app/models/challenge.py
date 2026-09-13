from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

# define o esquema de entrada para a criacao de um desafio pelo professor
class ChallengeCreate(BaseModel):
    title: str = Field(..., min_length=5, description="titulo curto do desafio")
    content: str = Field(..., min_length=10, description="texto formatado do desafio (markdown ou html)")
    image_url: Optional[str] = Field(None, description="link opcional para uma imagem ilustrativa")
    options: list[str] = Field(..., min_items=2, description="lista de opcoes de resposta")
    correct_answer: str = Field(..., description="a resposta correta exata")
    scheduled_date: date = Field(..., description="data em que o desafio ficara disponivel")

# define o esquema de saida retornado ao frontend (visao irrestrita do professor)
class ChallengeResponse(BaseModel):
    id: str
    classroom_id: str
    title: str
    content: str
    image_url: Optional[str] = None
    options: list[str]
    correct_answer: str
    scheduled_date: date

    class Config:
        populate_by_name = True

# define o esquema de saida seguro para o aluno (omite a resposta correta)
class ChallengeStudentResponse(BaseModel):
    id: str
    title: str
    content: str
    image_url: Optional[str] = None
    options: list[str]
    scheduled_date: date
    
    class Config:
        populate_by_name = True