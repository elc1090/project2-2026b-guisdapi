from fastapi import APIRouter, Depends, HTTPException, status
from app.models.student import StudentCreate, StudentResponse, StudentRankingResponse
from app.core.database import get_database
from app.core.security import get_password_hash
from app.core.dependencies import get_current_student_data
from bson import ObjectId
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/students", tags=["Alunos"])

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(student: StudentCreate):
    """
    cadastra um novo aluno no primeiro acesso.
    """
    db = get_database()
    
    # busca a turma pelo codigo de convite
    classroom = await db["classrooms"].find_one({"invite_code": student.classroom_code})
    if not classroom:
        raise HTTPException(status_code=404, detail="turma nao encontrada com este codigo")
    
    # valida se a turma aceita novos alunos
    if not classroom.get("is_open_for_enrollment", False):
        raise HTTPException(status_code=403, detail="esta turma esta fechada para novos alunos")
    
    # valida duplicidade de matricula
    existing_student = await db["students"].find_one({"matricula": student.matricula})
    if existing_student:
        raise HTTPException(status_code=400, detail="matricula ja cadastrada")
    
    # prepara os dados do aluno para o banco
    student_dict = student.model_dump()
    del student_dict["classroom_code"]
    student_dict["classroom_id"] = str(classroom["_id"])
    
    # criptografa o pin numerico
    pin_puro = student_dict.pop("pin")
    student_dict["hashed_pin"] = get_password_hash(pin_puro)
    
    # inicializa o status de gamificacao
    student_dict["streak"] = 0
    student_dict["last_submission_date"] = None
    
    # persiste o aluno no banco de dados
    result = await db["students"].insert_one(student_dict)
    
    # formata o id retornado
    student_dict["id"] = str(result.inserted_id)
    return student_dict

@router.get("/ranking", response_model=list[StudentRankingResponse])
async def get_classroom_ranking(student_data: dict = Depends(get_current_student_data)):
    """
    lista os dez melhores alunos da turma do usuario ativo.
    """
    db = get_database()
    
    # filtra alunos da turma, ordena decrescente e limita a dez resultados
    cursor = db["students"].find(
        {"classroom_id": student_data["classroom_id"]}
    ).sort([("score", -1), ("streak", -1)]).limit(10)
    
    # converte o resultado do db para lista
    ranking = await cursor.to_list(length=10)
    return ranking

@router.get("/me/timeline")
async def get_my_timeline(student_data: dict = Depends(get_current_student_data)):
    """
    monta a linha do tempo do aluno cruzando desafios e submissoes.
    """
    db = get_database()
    
    # busca os dados do aluno ativo
    student = await db["students"].find_one({"_id": ObjectId(student_data["student_id"])})
    
    # aborta caso o aluno tenha sido removido do sistema
    if not student:
        raise HTTPException(status_code=404, detail="aluno nao encontrado")
        
    # aplica regra do auto-healing
    streak_atual = student.get("streak", 0)
    ultima_sub = student.get("last_submission_date")
    
    if ultima_sub and streak_atual > 0:
        hoje_br = (datetime.now(timezone.utc) - timedelta(hours=3)).date()
        data_ultima = ultima_sub.replace(tzinfo=timezone.utc).date()
        
        # zera o streak silenciosamente se a inatividade for maior que um dia
        if (hoje_br - data_ultima).days > 1:
            streak_atual = 0
            await db["students"].update_one(
                {"_id": ObjectId(student_data["student_id"])},
                {"$set": {"streak": 0}}
            )
            student["streak"] = 0
    
    # busca os desafios da turma ordenados cronologicamente
    cursor_challenges = db["challenges"].find(
        {"classroom_id": student_data["classroom_id"]}
    ).sort("scheduled_date", 1)
    
    # expande o limite de leitura para cobrir um ano letivo completo
    challenges = await cursor_challenges.to_list(length=365)
    
    # busca as submissoes do aluno
    cursor_subs = db["submissions"].find({"student_id": student_data["student_id"]})
    submissions = await cursor_subs.to_list(length=365)
    
    # cria mapa de complexidade o(1) para cruzar os dados agilmente
    sub_map = {str(sub["challenge_id"]): sub for sub in submissions}
    
    history = []
    
    # consolida o historico formatado
    for ch in challenges:
        ch_id = str(ch["_id"])
        sub = sub_map.get(ch_id)
        history.append({
            "challenge_id": ch_id,
            "date": ch["scheduled_date"].strftime("%Y-%m-%d"),
            "has_submitted": bool(sub),
            "is_correct": sub["is_correct"] if sub else False
        })
        
    return {
        "student_name": student.get("name", "Aluno Desconhecido"),
        "streak": student.get("streak", 0),
        "history": history
    }