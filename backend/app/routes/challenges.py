from fastapi import APIRouter, Depends, HTTPException, status
from app.models.challenge import ChallengeCreate, ChallengeResponse, ChallengeStudentResponse
from app.core.database import get_database
from app.core.dependencies import get_current_teacher_id, get_current_student_data
from app.models.submission import SubmissionTeacherResponse
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/challenges", tags=["Desafios"])

@router.post("/{classroom_id}", response_model=ChallengeResponse, status_code=status.HTTP_201_CREATED)
async def create_challenge(
    classroom_id: str,
    challenge: ChallengeCreate,
    teacher_id: str = Depends(get_current_teacher_id) # injeta a dependencia e exige o token
):
    """
    endpoint protegido para o professor criar um desafio em sua turma especifica.
    """
    db = get_database()

    # 1. validacao estrutural: verifica se a string e um id valido do mongodb
    try:
        obj_classroom_id = ObjectId(classroom_id)
    except Exception:
        raise HTTPException(status_code=400, detail="formato de id da turma invalido")

    # 2. seguranca (autorizacao): verifica se a turma existe E se pertence ao professor logado
    classroom = await db["classrooms"].find_one({
        "_id": obj_classroom_id, 
        "teacher_id": teacher_id
    })
    
    if not classroom:
        raise HTTPException(
            status_code=403, 
            detail="turma nao encontrada ou voce nao tem permissao para edita-la"
        )

    # 3. prepara o dicionario do desafio
    challenge_dict = challenge.model_dump()
    
    # mongodb exige o formato datetime (data e hora), mas o frontend manda so a data (date)
    # converte a data simples para datetime (meia-noite) para o banco aceitar
    challenge_dict["scheduled_date"] = datetime.combine(challenge.scheduled_date, datetime.min.time())
    
    # anexa o id da turma para criar a relacao (foreign key no mundo nosql)
    challenge_dict["classroom_id"] = classroom_id

    # 4. salva no banco de dados
    result = await db["challenges"].insert_one(challenge_dict)

    # 5. prepara o retorno (o pydantic converte o datetime de volta para date automaticamente)
    challenge_dict["id"] = str(result.inserted_id)
    
    return challenge_dict

# atencao ao response_model: e ele quem apaga a resposta correta!
@router.get("/today", response_model=ChallengeStudentResponse)
async def get_today_challenge(student_data: dict = Depends(get_current_student_data)):
    db = get_database()
    
    hoje = datetime.now(timezone.utc).date()
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
    teacher_id: str = Depends(get_current_teacher_id) # exige token do professor
):
    """
    endpoint para o professor visualizar todas as respostas e raciocinios de um desafio especifico.
    """
    db = get_database()

    try:
        obj_challenge_id = ObjectId(challenge_id)
    except Exception:
        raise HTTPException(status_code=400, detail="id do desafio invalido")

    # 1. busca o desafio para descobrir de qual turma ele eh
    challenge = await db["challenges"].find_one({"_id": obj_challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="desafio nao encontrado")

    # 2. seguranca: garante que o professor logado seja o dono da turma que criou o desafio
    classroom = await db["classrooms"].find_one({
        "_id": ObjectId(challenge["classroom_id"]),
        "teacher_id": teacher_id
    })
    
    if not classroom:
        raise HTTPException(status_code=403, detail="voce nao tem permissao para ver os dados desta turma")

    # 3. busca todas as submissoes feitas para este desafio
    cursor = db["submissions"].find({"challenge_id": challenge_id})
    submissions_list = await cursor.to_list(length=100) # limite de 100 alunos para seguranca de memoria

    # 4. enriquece os dados: para cada submissao, busca o nome do aluno no banco
    resultado_final = []
    for sub in submissions_list:
        student = await db["students"].find_one({"_id": ObjectId(sub["student_id"])})
        
        # se por acaso o aluno foi deletado, usa "Aluno Desconhecido"
        nome_aluno = student["name"] if student else "Aluno Desconhecido"
        
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
    endpoint para o professor ver todos os desafios que ele criou para uma turma.
    """
    db = get_database()

    try:
        obj_classroom_id = ObjectId(classroom_id)
    except Exception:
        raise HTTPException(status_code=400, detail="formato de id da turma invalido")

    # 1. verifica se a turma existe e se pertence ao professor logado
    classroom = await db["classrooms"].find_one({
        "_id": obj_classroom_id, 
        "teacher_id": teacher_id
    })
    
    if not classroom:
        raise HTTPException(
            status_code=403, 
            detail="turma nao encontrada ou voce nao tem permissao para acessa-la"
        )

    # 2. busca todos os desafios linkados a esta turma (ordenados do mais recente pro mais antigo)
    cursor = db["challenges"].find({"classroom_id": classroom_id}).sort("scheduled_date", -1)
    challenges_list = await cursor.to_list(length=100)

    # 3. formata o campo _id para id para o Pydantic validar corretamente
    for challenge in challenges_list:
        challenge["id"] = str(challenge["_id"])

    return challenges_list