from fastapi import APIRouter, Depends, HTTPException, status
from app.models.challenge import ChallengeCreate, ChallengeResponse
from app.core.database import get_database
from app.core.dependencies import get_current_teacher_id
from bson import ObjectId
from datetime import datetime

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