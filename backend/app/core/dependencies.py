from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.database import settings

# define o esquema de autenticacao integrado ao swagger
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_teacher_id(token: str = Depends(oauth2_scheme)) -> str:
    # tenta decodificar o jwt usando a chave secreta do servidor
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")

        # valida a existencia do payload e o cargo de professor
        if user_id is None or role != "teacher":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="credenciais invalidas"
            )

        # retorna o id do professor extraido do token
        return user_id
        
    except JWTError:
        # captura falhas de decodificacao ou tokens expirados
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="token invalido ou expirado"
        )