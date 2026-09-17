from fastapi import APIRouter, Depends, status, HTTPException
from app.models.classroom import ClassroomCreate, ClassroomResponse, ClassroomUpdate
from app.core.database import get_database
from app.core.dependencies import get_current_teacher_id
import secrets
import string
from bson import ObjectId

router = APIRouter(prefix="/classrooms", tags=["Turmas"])

def generate_invite_code(length: int = 6) -> str:
    """
    gera um codigo alfanumerico seguro para convite da turma.
    """
    letters_and_digits = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(letters_and_digits) for i in range(length))

@router.post("/", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
async def create_classroom(
    classroom: ClassroomCreate,
    teacher_id: str = Depends(get_current_teacher_id)
):
    """
    cria uma nova turma vinculada ao professor autenticado.
    """
    db = get_database()
    
    classroom_dict = classroom.model_dump()
    classroom_dict["teacher_id"] = teacher_id
    classroom_dict["invite_code"] = generate_invite_code()
    classroom_dict["is_open_for_enrollment"] = True
    
    result = await db["classrooms"].insert_one(classroom_dict)
    classroom_dict["id"] = str(result.inserted_id)
    return classroom_dict

@router.get("/", response_model=list[ClassroomResponse])
async def get_teacher_classrooms(
    teacher_id: str = Depends(get_current_teacher_id)
):
    """
    lista todas as turmas gerenciadas pelo professor logado.
    """
    db = get_database()
    
    cursor = db["classrooms"].find({"teacher_id": teacher_id})
    classrooms_list = await cursor.to_list(length=100)
    
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
    edita os dados de uma turma existente.
    """
    db = get_database()
    
    try:
        obj_id = ObjectId(classroom_id)
    except Exception:
        raise HTTPException(status_code=400, detail="id da turma invalido")
        
    result = await db["classrooms"].update_one(
        {"_id": obj_id, "teacher_id": teacher_id},
        {"$set": {"name": classroom_update.name}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="turma nao encontrada ou sem permissao")
        
    updated_classroom = await db["classrooms"].find_one({"_id": obj_id})
    updated_classroom["id"] = str(updated_classroom["_id"])
    return updated_classroom

@router.delete("/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_classroom(
    classroom_id: str,
    teacher_id: str = Depends(get_current_teacher_id)
):
    """
    deleta uma turma e aplica exclusao em cascata para dependencias.
    """
    db = get_database()
    
    try:
        obj_id = ObjectId(classroom_id)
    except Exception:
        raise HTTPException(status_code=400, detail="id da turma invalido")
        
    classroom = await db["classrooms"].find_one({"_id": obj_id, "teacher_id": teacher_id})
    if not classroom:
        raise HTTPException(status_code=404, detail="turma nao encontrada ou sem permissao")
        
    # exclusao em cascata: remove todas as entidades filhas
    await db["submissions"].delete_many({"classroom_id": classroom_id})
    
    desafios = await db["challenges"].find({"classroom_id": classroom_id}).to_list(length=None)
    desafios_ids = [str(d["_id"]) for d in desafios]
    
    if desafios_ids:
        await db["challenge_views"].delete_many({"challenge_id": {"$in": desafios_ids}})
        
    await db["challenges"].delete_many({"classroom_id": classroom_id})
    await db["students"].delete_many({"classroom_id": classroom_id})
    await db["classrooms"].delete_one({"_id": obj_id})