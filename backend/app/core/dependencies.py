from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.database import settings

# mudança de oauth2passwordbearer para httpbearer (permite colar qualquer token no swagger)
security = HTTPBearer()

async def get_current_teacher_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    # extrai a string do token de dentro do objeto credentials
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")

        if user_id is None or role != "teacher":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="credenciais invalidas para professor"
            )

        return user_id
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="token invalido ou expirado"
        )


async def get_current_student_data(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    # extrai a string do token de dentro do objeto credentials
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        classroom_id: str = payload.get("classroom_id")

        if user_id is None or role != "student":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="credenciais invalidas para aluno"
            )

        return {
            "student_id": user_id, 
            "classroom_id": classroom_id
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="token invalido ou expirado"
        )