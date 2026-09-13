from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.database import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # token expira em 7 dias

def get_password_hash(password: str) -> str:
    """Recebe a senha em texto puro e retorna o hash criptografado."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha digitada no login bate com o hash salvo no banco."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    """Gera o token JWT assinado."""
    to_encode = data.copy()

    # Define a data de expiração do token, que é a data atual + 7 dias
    expire = datetime.now(tz=timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Assina o token usando a SECRET_KEY que está no arquivo .env
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt