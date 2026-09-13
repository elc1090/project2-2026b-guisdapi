from pydantic import BaseModel, EmailStr, Field

# 1. Schema de ENTRADA (O que o frontend envia no cadastro)
class TeacherCreate(BaseModel):
    name: str = Field(..., min_length=3, description="Nome completo do professor")
    email: EmailStr = Field(..., description="Email válido institucional ou pessoal")
    password: str = Field(..., min_length=6, description="Senha forte para login")

# 2. Schema de SAÍDA (O que nós devolvemos para o frontend)
class TeacherResponse(BaseModel):
    id: str
    name: str
    email: EmailStr

    class Config:
        populate_by_name = True