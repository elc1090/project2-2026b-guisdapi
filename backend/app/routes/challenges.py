from fastapi import APIRouter, Depends, HTTPException, status
from app.models.challenge import ChallengeCreate, ChallengeResponse, ChallengeStudentResponse
from app.core.database import get_database
from app.core.dependencies import get_current_teacher_id, get_current_student_data
from app.models.submission import SubmissionTeacherResponse
from bson import ObjectId
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/challenges", tags=["Desafios"])

@router.post("/{classroom_id}", response_model=ChallengeResponse, status_code=status.HTTP_201_CREATED)
async def create_challenge(
    classroom_id: str,
    challenge: ChallengeCreate,
    teacher_id: str = Depends(get_current_teacher_id)
):
    """
    cria um desafio e vincula a uma turma especifica.
    """
    db = get_database()
    
    try:
        obj_classroom_id = ObjectId(classroom_id)
    except Exception:
        raise HTTPException(status_code=400, detail="formato de id da turma invalido")
        
    classroom = await db["classrooms"].find_one({
        "_id": obj_classroom_id, 
        "teacher_id": teacher_id
    })
    if not classroom:
        raise HTTPException(status_code=403, detail="turma nao encontrada ou sem permissao")
        
    challenge_dict = challenge.model_dump()
    challenge_dict["scheduled_date"] = datetime.combine(challenge.scheduled_date, datetime.min.time())
    challenge_dict["classroom_id"] = classroom_id
    
    result = await db["challenges"].insert_one(challenge_dict)
    challenge_dict["id"] = str(result.inserted_id)
    return challenge_dict

@router.get("/today", response_model=ChallengeStudentResponse)
async def get_today_challenge(student_data: dict = Depends(get_current_student_data)):
    """
    busca o desafio do dia atual para o aluno.
    """
    db = get_database()
    
    hoje = (datetime.now(timezone.utc) - timedelta(hours=3)).date()
    today = datetime.combine(hoje, datetime.min.time())
    
    challenge = await db["challenges"].find_one({
        "classroom_id": student_data["classroom_id"],
        "scheduled_date": today
    })
    if not challenge:
        raise HTTPException(status_code=404, detail="nenhum desafio publicado para hoje na sua turma")
        
    view_record = await db["challenge_views"].find_one({
        "challenge_id": str(challenge["_id"]),
        "student_id": student_data["student_id"]
    })
    
    if not view_record:
        await db["challenge_views"].insert_one({
            "challenge_id": str(challenge["_id"]),
            "student_id": student_data["student_id"],
            "viewed_at": datetime.now(timezone.utc)
        })
        
    challenge["id"] = str(challenge["_id"])
    return challenge

@router.get("/{challenge_id}/submissions", response_model=list[SubmissionTeacherResponse])
async def get_challenge_submissions(
    challenge_id: str,
    teacher_id: str = Depends(get_current_teacher_id)
):
    """
    lista todas as submissoes de um desafio resolvendo o problema de query n+1.
    """
    db = get_database()
    try:
        obj_challenge_id = ObjectId(challenge_id)
    except Exception:
        raise HTTPException(status_code=400, detail="id do desafio invalido")
        
    challenge = await db["challenges"].find_one({"_id": obj_challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="desafio nao encontrado")
        
    classroom = await db["classrooms"].find_one({
        "_id": ObjectId(challenge["classroom_id"]),
        "teacher_id": teacher_id
    })
    if not classroom:
        raise HTTPException(status_code=403, detail="voce nao tem permissao para ver os dados")
        
    # busca as submissoes de uma so vez
    cursor = db["submissions"].find({"challenge_id": challenge_id})
    submissions_list = await cursor.to_list(length=100)
    
    # otimizacao (anti n+1 queries): extrai todos os ids e busca de uma vez
    student_ids = [ObjectId(sub["student_id"]) for sub in submissions_list]
    
    students_cursor = db["students"].find({"_id": {"$in": student_ids}})
    students_list = await students_cursor.to_list(length=100)
    
    # cria um dicionario para busca instantanea o(1) em memoria
    student_map = {str(s["_id"]): s["name"] for s in students_list}
    
    resultado_final = []
    for sub in submissions_list:
        nome_aluno = student_map.get(sub["student_id"], "Aluno Desconhecido")
        resultado_final.append({
            "id": str(sub["_id"]),
            "student_name": nome_aluno,
            "option_selected": sub["option_selected"],
            "reasoning": sub["reasoning"],
            "is_correct": sub["is_correct"],
            "score_earned": sub.get("score_earned", 0),
            "submitted_at": sub["submitted_at"]
        })
        
    return resultado_final

@router.get("/classroom/{classroom_id}", response_model=list[ChallengeResponse])
async def get_classroom_challenges(
    classroom_id: str,
    teacher_id: str = Depends(get_current_teacher_id)
):
    """
    retorna a lista de desafios criados para uma turma especifica.
    """
    db = get_database()
    try:
        obj_classroom_id = ObjectId(classroom_id)
    except Exception:
        raise HTTPException(status_code=400, detail="formato de id da turma invalido")
        
    classroom = await db["classrooms"].find_one({
        "_id": obj_classroom_id, 
        "teacher_id": teacher_id
    })
    if not classroom:
        raise HTTPException(status_code=403, detail="turma nao encontrada")
        
    cursor = db["challenges"].find({"classroom_id": classroom_id}).sort("scheduled_date", -1)
    challenges_list = await cursor.to_list(length=100)
    
    for challenge in challenges_list:
        challenge["id"] = str(challenge["_id"])
        
    return challenges_list

@router.put("/{challenge_id}", response_model=ChallengeResponse)
async def update_challenge(
    challenge_id: str,
    challenge_update: ChallengeCreate,
    teacher_id: str = Depends(get_current_teacher_id)
):
    """
    atualiza as informacoes e o conteudo de um desafio.
    """
    db = get_database()
    try:
        obj_challenge_id = ObjectId(challenge_id)
    except Exception:
        raise HTTPException(status_code=400, detail="id do desafio invalido")
        
    challenge = await db["challenges"].find_one({"_id": obj_challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="desafio nao encontrado")
        
    classroom = await db["classrooms"].find_one({
        "_id": ObjectId(challenge["classroom_id"]),
        "teacher_id": teacher_id
    })
    if not classroom:
        raise HTTPException(status_code=403, detail="permissao negada")
        
    update_data = challenge_update.model_dump()
    update_data["scheduled_date"] = datetime.combine(challenge_update.scheduled_date, datetime.min.time())
    
    await db["challenges"].update_one(
        {"_id": obj_challenge_id},
        {"$set": update_data}
    )
    
    updated_challenge = await db["challenges"].find_one({"_id": obj_challenge_id})
    updated_challenge["id"] = str(updated_challenge["_id"])
    return updated_challenge

@router.delete("/{challenge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_challenge(
    challenge_id: str,
    teacher_id: str = Depends(get_current_teacher_id)
):
    """
    deleta um desafio e limpa as submissoes e visualizacoes vinculadas.
    """
    db = get_database()
    try:
        obj_challenge_id = ObjectId(challenge_id)
    except Exception:
        raise HTTPException(status_code=400, detail="id do desafio invalido")
        
    challenge = await db["challenges"].find_one({"_id": obj_challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="desafio nao encontrado")
        
    classroom = await db["classrooms"].find_one({
        "_id": ObjectId(challenge["classroom_id"]),
        "teacher_id": teacher_id
    })
    if not classroom:
        raise HTTPException(status_code=403, detail="permissao negada")
        
    # exclusao em cascata
    await db["submissions"].delete_many({"challenge_id": challenge_id})
    await db["challenge_views"].delete_many({"challenge_id": challenge_id})
    await db["challenges"].delete_one({"_id": obj_challenge_id})

@router.get("/{challenge_id}/student", response_model=ChallengeStudentResponse)
async def get_specific_challenge_for_student(
    challenge_id: str,
    student_data: dict = Depends(get_current_student_data)
):
    """
    busca um desafio especifico do passado garantindo leitura segura.
    """
    db = get_database()
    try:
        obj_challenge_id = ObjectId(challenge_id)
    except Exception:
        raise HTTPException(status_code=400, detail="id do desafio invalido")
        
    challenge = await db["challenges"].find_one({
        "_id": obj_challenge_id,
        "classroom_id": student_data["classroom_id"]
    })
    if not challenge:
        raise HTTPException(status_code=404, detail="desafio nao encontrado")
        
    hoje = datetime.now(timezone.utc).date()
    data_desafio = challenge["scheduled_date"].date()
    
    if data_desafio > hoje:
        raise HTTPException(status_code=403, detail="este desafio ainda nao esta disponivel")
        
    challenge["id"] = str(challenge["_id"])
    return challenge