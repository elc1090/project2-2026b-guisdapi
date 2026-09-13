from fastapi import APIRouter, HTTPException, status
from app.models.auth import LoginRequest, TokenResponse
from app.core.database import get_database
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Autenticação"])

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """
    Endpoint para realizar o login do Professor e obter o Token JWT.
    """
    db = get_database()

    # procura se existe algum professor com este email
    user = await db["teachers"].find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    # se achou o email, verifica se a senha digitada bate com o hash do banco
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    # se tudo estiver certo, prepara os dados públicos que vão dentro do token
    # converte o _id (ObjectId do Mongo) para string 
    token_data = {
        "sub": str(user["_id"]), # 'sub' (subject) é o padrão JWT para o ID do usuário
        "role": "teacher"        # guarda o cargo para garantir o RBAC depois, RBAC quer dizer: Role-Based Access Control, ou seja, controle de acesso baseado em cargo
    }
    
    # cria o token JWT assinado com a SECRET_KEY que está no arquivo .env e envia de volta para o Frontend
    token = create_access_token(token_data)

    return {"access_token": token, "token_type": "bearer"}