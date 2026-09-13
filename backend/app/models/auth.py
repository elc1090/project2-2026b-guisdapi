from pydantic import BaseModel, EmailStr

# 1. O que recebemos do Frontend no momento do Login
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# 2. O que devolvemos para o Frontend se o login der certo
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"