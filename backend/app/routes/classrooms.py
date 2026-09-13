from fastapi import APIRouter, Depends, status
from app.models.classroom import ClassroomCreate, ClassroomResponse
from app.core.database import get_database
from app.core.dependencies import get_current_teacher_id
import random
import string

router = APIRouter(prefix="/classrooms", tags=["Turmas"])

def generate_invite_code(length: int = 6) -> str:
    # gera uma string aleatoria combinando letras maiusculas e numeros
    letters_and_digits = string.ascii_uppercase + string.digits
    return ''.join(random.choice(letters_and_digits) for i in range(length))

@router.post("/", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
async def create_classroom(
    classroom: ClassroomCreate,
    teacher_id: str = Depends(get_current_teacher_id) # injeta a dependencia de autenticacao
):
    """
    Endpoint protegido para criacao de turmas.
    """
    db = get_database()

    # converte o modelo pydantic para dicionario
    classroom_dict = classroom.model_dump()
    
    # anexa os metadados gerados pelo servidor
    classroom_dict["teacher_id"] = teacher_id
    classroom_dict["invite_code"] = generate_invite_code()
    classroom_dict["is_open_for_enrollment"] = True

    # insere o documento no mongodb
    result = await db["classrooms"].insert_one(classroom_dict)

    # converte o objectid e formata o retorno
    classroom_dict["id"] = str(result.inserted_id)
    return classroom_dict