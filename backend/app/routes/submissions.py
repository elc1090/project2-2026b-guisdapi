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
    score_earned = 10 # pontuacao base de participacao (se errar)

    if is_correct:
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
            
    submission_dict = submission.model_dump()
    submission_dict["challenge_id"] = challenge_id
    submission_dict["student_id"] = student_data["student_id"]
    submission_dict["classroom_id"] = student_data["classroom_id"]
    submission_dict["is_correct"] = is_correct
    submission_dict["score_earned"] = score_earned
    submission_dict["submitted_at"] = datetime.now(timezone.utc)

    result = await db["submissions"].insert_one(submission_dict)

    student = await db["students"].find_one({"_id": ObjectId(student_data["student_id"])})
    novo_streak = student.get("streak", 0) + 1
    pontuacao_total = student.get("score", 0) + score_earned 
    
    
    hoje = datetime.now(timezone.utc).date()
    hoje_datetime = datetime.combine(hoje, datetime.min.time())
    
    await db["students"].update_one(
        {"_id": ObjectId(student_data["student_id"])},
        {"$set": {
            "streak": novo_streak, 
            "score": pontuacao_total,
            "last_submission_date": hoje_datetime
        }}
    )

    return {
        "id": str(result.inserted_id),
        "is_correct": is_correct,
        "correct_answer": challenge["correct_answer"],
        "streak_updated": novo_streak,
        "score_earned": score_earned
    }