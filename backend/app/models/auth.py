from pydantic import BaseModel, EmailStr

# define o esquema json recebido do frontend do aluno
class StudentLoginRequest(BaseModel):
    matricula: str
    pin: str

# define a saida padrao de tokens para ambos os tipos de usuarios
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"