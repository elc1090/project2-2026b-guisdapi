from fastapi import APIRouter, HTTPException, status
from app.models.teacher import TeacherCreate, TeacherResponse
from app.core.security import get_password_hash
from app.core.database import get_database

# O APIRouter permite separar as rotas em vários arquivos em vez de jogar tudo no main.py
router = APIRouter(prefix="/teachers", tags=["Professores"])

@router.post("/", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher(teacher: TeacherCreate):
    """
    Endpoint para cadastrar um novo professor.
    """
    db = get_database()
    
    # 1. Regra de Negócio: Não podemos ter dois professores com o mesmo email
    existing_teacher = await db["teachers"].find_one({"email": teacher.email})
    if existing_teacher:
        raise HTTPException(status_code=400, detail="Este email já está em uso.")

    # 2. Segurança: Criptografar a senha
    hashed_password = get_password_hash(teacher.password)
    
    # 3. Preparar o documento para o MongoDB (convertemos o Pydantic para dicionário)
    teacher_dict = teacher.model_dump()
    del teacher_dict["password"] # Remove a senha em texto puro por segurança!
    teacher_dict["hashed_password"] = hashed_password # Adiciona a senha criptografada
    
    # 4. Salvar no banco de dados
    result = await db["teachers"].insert_one(teacher_dict)
    
    # 5. Retornar os dados para o Frontend (convertendo o ObjectId do Mongo para string)
    teacher_dict["id"] = str(result.inserted_id)
    return teacher_dict