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
    Endpoint para o primeiro acesso (cadastro) do aluno.
    """
    db = get_database()

    # 1. busca a turma pelo codigo de convite enviado pelo aluno
    classroom = await db["classrooms"].find_one({"invite_code": student.classroom_code})
    if not classroom:
        raise HTTPException(status_code=404, detail="turma nao encontrada com este codigo")

    # 2. verifica se o professor trancou a entrada de novos alunos
    if not classroom.get("is_open_for_enrollment", False):
        raise HTTPException(status_code=403, detail="esta turma esta fechada para novos alunos")

    # 3. verifica se a matricula ja existe no sistema para evitar duplicidade
    existing_student = await db["students"].find_one({"matricula": student.matricula})
    if existing_student:
        raise HTTPException(status_code=400, detail="matricula ja cadastrada")

    # 4. prepara os dados do aluno para insercao no mongodb
    student_dict = student.model_dump()
    
    # substitui o codigo temporario pelo id real da turma no banco
    del student_dict["classroom_code"]
    student_dict["classroom_id"] = str(classroom["_id"])
    
    # criptografa o pin de 4 digitos
    pin_puro = student_dict.pop("pin")
    student_dict["hashed_pin"] = get_password_hash(pin_puro)
    
    # inicializa as variaveis de gamificacao do aluno
    student_dict["streak"] = 0
    student_dict["last_submission_date"] = None

    # 5. salva o documento final na colecao de alunos
    result = await db["students"].insert_one(student_dict)

    # 6. anexa o id gerado e retorna os dados seguros para o frontend
    student_dict["id"] = str(result.inserted_id)
    return student_dict

@router.get("/ranking", response_model=list[StudentRankingResponse])
async def get_classroom_ranking(student_data: dict = Depends(get_current_student_data)):
    """
    endpoint para listar os 10 melhores alunos da turma do usuario logado.
    """
    db = get_database()
    
    # 1. filtra apenas os alunos que pertencem a mesma turma do aluno que fez a requisicao
    # 2. ordena primeiro pela pontuacao (score) decrescente (-1) e em caso de empate, pelo streak decrescente (-1)
    # 3. limita o resultado aos 10 primeiros para nao sobrecarregar a rede
    cursor = db["students"].find(
        {"classroom_id": student_data["classroom_id"]}
    ).sort([("score", -1), ("streak", -1)]).limit(10)
    
    # converte o cursor do mongodb para uma lista do python
    ranking = await cursor.to_list(length=10)
    
    return ranking

@router.get("/me/timeline")
async def get_my_timeline(student_data: dict = Depends(get_current_student_data)):
    """
    endpoint BFF para montar a linha do tempo exata do aluno cruzando desafios vs submissões.
    """
    db = get_database()
    
    # busca os dados do aluno 
    student = await db["students"].find_one({"_id": ObjectId(student_data["student_id"])})

    # --- AUTO-HEALING DO STREAK ---
    streak_atual = student.get("streak", 0)
    ultima_sub = student.get("last_submission_date")
    
    if ultima_sub and streak_atual > 0:
        hoje_br = (datetime.now(timezone.utc) - timedelta(hours=3)).date()
        data_ultima = ultima_sub.replace(tzinfo=timezone.utc).date()
        
        # Se passou mais de 1 dia desde a última submissão, quebra o streak silenciosamente
        if (hoje_br - data_ultima).days > 1:
            streak_atual = 0
            await db["students"].update_one(
                {"_id": ObjectId(student_data["student_id"])},
                {"$set": {"streak": 0}}
            )
            student["streak"] = 0 # Atualiza na memoria para devolver ao frontend
    
    # busca todos os desafios da turma 
    cursor_challenges = db["challenges"].find({"classroom_id": student_data["classroom_id"]})
    challenges = await cursor_challenges.to_list(length=100)
    
    # busca todas as submissões deste aluno
    cursor_subs = db["submissions"].find({"student_id": student_data["student_id"]})
    submissions = await cursor_subs.to_list(length=100)
    
    # truque de performance: cria um dicionário/mapa O(1) das submissões pelo ID do desafio
    sub_map = {str(sub["challenge_id"]): sub for sub in submissions}
    
    history = []
    for ch in challenges:
        ch_id = str(ch["_id"])
        sub = sub_map.get(ch_id)
        history.append({
            "challenge_id": ch_id,
            "date": ch["scheduled_date"].strftime("%Y-%m-%d"), # Formata para a string de calendário
            "has_submitted": bool(sub),
            "is_correct": sub["is_correct"] if sub else False
        })
        
    return {
        "student_name": student.get("name", "Aluno Desconhecido"),
        "streak": student.get("streak", 0),
        "history": history
    }