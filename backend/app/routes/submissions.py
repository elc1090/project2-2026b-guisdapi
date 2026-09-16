from fastapi import APIRouter, Depends, HTTPException, status
from app.models.submission import SubmissionCreate, SubmissionResponse
from app.core.database import get_database
from app.core.dependencies import get_current_student_data
from bson import ObjectId
from datetime import datetime, date, timezone

router = APIRouter(prefix="/submissions", tags=["Submissões"])

@router.post("/{challenge_id}", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    challenge_id: str,
    submission: SubmissionCreate,
    student_data: dict = Depends(get_current_student_data)
):
    db = get_database()

    try:
        obj_challenge_id = ObjectId(challenge_id)
    except Exception:
        raise HTTPException(status_code=400, detail="id do desafio invalido")

    challenge = await db["challenges"].find_one({"_id": obj_challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="desafio nao encontrado")

    existing_submission = await db["submissions"].find_one({
        "challenge_id": challenge_id,
        "student_id": student_data["student_id"]
    })
    
    if existing_submission:
        raise HTTPException(status_code=400, detail="voce ja enviou uma resposta para este desafio")

    is_correct = (submission.option_selected == challenge["correct_answer"])

# --- LOGICA TEMPORAL E GAMIFICACAO ---
    hoje = datetime.now(timezone.utc).date()
    data_desafio = challenge["scheduled_date"].date()
    is_desafio_atrasado = data_desafio < hoje

    student = await db["students"].find_one({"_id": ObjectId(student_data["student_id"])})
    streak_atual = student.get("streak", 0)
    ultima_submissao = student.get("last_submission_date")

    # 1. Verifica se a ofensiva quebrou (mais de 1 dia de diferenca)
    if ultima_submissao:
        # Pega apenas a data (sem horas) para comparar com 'hoje'
        data_ultima = ultima_submissao.replace(tzinfo=timezone.utc).date()
        dias_passados = (hoje - data_ultima).days

        if dias_passados > 1:
            streak_atual = 0 # O aluno faltou um dia, a ofensiva zera!

    # 2. Calcula pontos e nova ofensiva
    score_earned = 10 # pontuacao base de participacao
    novo_streak = streak_atual
    data_para_salvar = ultima_submissao # Mantem a data antiga por padrao

    if is_desafio_atrasado:
        # Desafio do passado: nao altera o streak, nem registra como "presenca do dia"
        if is_correct:
            score_earned = 50
    else:
        # Desafio do dia: o aluno marcou presenca, ganha +1 de ofensiva
        novo_streak = streak_atual + 1
        # Atualiza a data para salvar apenas se for o desafio de hoje
        data_para_salvar = datetime.combine(hoje, datetime.min.time()) 
        
        if is_correct:
            # Logica de decaimento de pontos pelo tempo (reaproveitada)
            view_record = await db["challenge_views"].find_one({
                "challenge_id": challenge_id,
                "student_id": student_data["student_id"]
            })
            
            if view_record:
                agora = datetime.now(timezone.utc)
                hora_visualizacao = view_record["viewed_at"].replace(tzinfo=timezone.utc)
                time_elapsed = (agora - hora_visualizacao).total_seconds()
                
                pontos_calculados = int(100 - (time_elapsed / 2))
                score_earned = max(50, min(100, pontos_calculados))
            else:
                score_earned = 50

    # prepara o dicionario da submissao
    submission_dict = submission.model_dump()
    submission_dict["challenge_id"] = challenge_id
    submission_dict["student_id"] = student_data["student_id"]
    submission_dict["classroom_id"] = student_data["classroom_id"]
    submission_dict["is_correct"] = is_correct
    submission_dict["score_earned"] = score_earned
    submission_dict["submitted_at"] = datetime.now(timezone.utc)

    # insere no banco
    result = await db["submissions"].insert_one(submission_dict)

    # 3. Salva os novos dados do aluno
    pontuacao_total = student.get("score", 0) + score_earned
    
    await db["students"].update_one(
        {"_id": ObjectId(student_data["student_id"])},
        {"$set": {
            "streak": novo_streak, 
            "score": pontuacao_total,
            "last_submission_date": data_para_salvar # Salva a data processada!
        }}
    )

    return {
        "id": str(result.inserted_id),
        "is_correct": is_correct,
        "correct_answer": challenge["correct_answer"],
        "streak_updated": novo_streak,
        "score_earned": score_earned
    }