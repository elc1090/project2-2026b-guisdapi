from fastapi import APIRouter, Depends, status, HTTPException
from app.models.classroom import ClassroomCreate, ClassroomResponse, ClassroomUpdate
from app.core.database import get_database
from app.core.dependencies import get_current_teacher_id
import random
import string
from bson import ObjectId

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

@router.get("/", response_model=list[ClassroomResponse])
async def get_teacher_classrooms(
    teacher_id: str = Depends(get_current_teacher_id)
):
    """
    endpoint protegido para listar todas as turmas do professor logado.
    """
    db = get_database()
    
    # realiza a query buscando apenas turmas pertencentes ao professor autenticado
    cursor = db["classrooms"].find({"teacher_id": teacher_id})
    
    # converte o cursor em lista, limitando a 100 registros por segurança de memória
    classrooms_list = await cursor.to_list(length=100)
    
    # mapeia o _id do mongodb para o campo id esperado pelo schema do pydantic
    for classroom in classrooms_list:
        classroom["id"] = str(classroom["_id"])
        
    return classrooms_list


@router.put("/{classroom_id}", response_model=ClassroomResponse)
async def update_classroom(
    classroom_id: str,
    classroom_update: ClassroomUpdate,
    teacher_id: str = Depends(get_current_teacher_id)
):
    """
    endpoint para o professor editar o nome de uma turma existente.
    """
    db = get_database()
    
    # valida a string do objectid
    try:
        obj_id = ObjectId(classroom_id)
    except Exception:
        raise HTTPException(status_code=400, detail="id da turma invalido")

    # atualiza a turma garantindo que ela pertence ao professor logado
    result = await db["classrooms"].update_one(
        {"_id": obj_id, "teacher_id": teacher_id},
        {"$set": {"name": classroom_update.name}}
    )

    # verifica se encontrou e atualizou a turma
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="turma nao encontrada ou sem permissao")

    # busca a turma atualizada para retornar ao frontend
    updated_classroom = await db["classrooms"].find_one({"_id": obj_id})
    updated_classroom["id"] = str(updated_classroom["_id"])
    
    return updated_classroom


@router.delete("/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_classroom(
    classroom_id: str,
    teacher_id: str = Depends(get_current_teacher_id)
):
    """
    endpoint para o professor deletar uma turma e todas as dependencias (cascade delete manual).
    """
    db = get_database()
    
    # valida a string do objectid
    try:
        obj_id = ObjectId(classroom_id)
    except Exception:
        raise HTTPException(status_code=400, detail="id da turma invalido")

    # verifica se a turma existe e pertence ao professor
    classroom = await db["classrooms"].find_one({"_id": obj_id, "teacher_id": teacher_id})
    if not classroom:
        raise HTTPException(status_code=404, detail="turma nao encontrada ou sem permissao")

    # deleta todas as submissoes vinculadas a esta turma
    await db["submissions"].delete_many({"classroom_id": classroom_id})
    
    # deleta todos os historicos de visualizacao de desafios vinculados aos alunos desta turma
    # (como nao salvamos o classroom_id nas views, deletamos filtrando os desafios primeiro)
    desafios = await db["challenges"].find({"classroom_id": classroom_id}).to_list(length=None)
    desafios_ids = [str(d["_id"]) for d in desafios]
    if desafios_ids:
        await db["challenge_views"].delete_many({"challenge_id": {"$in": desafios_ids}})

    # deleta todos os desafios da turma
    await db["challenges"].delete_many({"classroom_id": classroom_id})
    
    # deleta todos os alunos da turma
    await db["students"].delete_many({"classroom_id": classroom_id})
    
    # por fim, deleta a propria turma
    await db["classrooms"].delete_one({"_id": obj_id})