from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.models.auth import TokenResponse
from app.core.database import get_database
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# injeta a dependencia nativa de formulario do fastapi
@router.post("/login", response_model=TokenResponse)
async def login(credentials: OAuth2PasswordRequestForm = Depends()):
    """
    Endpoint para realizar o login do Professor e obter o Token JWT.
    """
    db = get_database()

    # o padrao oauth2 sempre chama o campo de login de 'username'
    # portanto, mapeamos o credentials.username para buscar o email no banco
    user = await db["teachers"].find_one({"email": credentials.username})
    if not user:
        raise HTTPException(status_code=401, detail="email ou senha incorretos")

    # verifica se a senha digitada bate com o hash salvo
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="email ou senha incorretos")

    # prepara os dados do jwt
    token_data = {
        "sub": str(user["_id"]), 
        "role": "teacher"        
    }
    
    # gera o token assinado
    token = create_access_token(token_data)

    return {"access_token": token, "token_type": "bearer"}