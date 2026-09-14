from fastapi import APIRouter, Depends, HTTPException, status
from app.models.student import StudentCreate, StudentResponse, StudentRankingResponse
from app.core.database import get_database
from app.core.security import get_password_hash
from app.core.dependencies import get_current_student_data

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