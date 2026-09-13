from pydantic import BaseModel, EmailStr, Field

# define o esquema de entrada para o primeiro acesso do professor
class TeacherCreate(BaseModel):
    name: str = Field(..., min_length=3, description="Nome completo do professor")
    email: EmailStr = Field(..., description="Email válido institucional ou pessoal")
    password: str = Field(..., min_length=6, description="Senha forte para login")

# define o esquema de saida retornado ao frontend
class TeacherResponse(BaseModel):
    id: str
    name: str
    email: EmailStr

    class Config:
        populate_by_name = True