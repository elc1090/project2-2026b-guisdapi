from pydantic import BaseModel, Field

# define o esquema de entrada enviado pelo frontend
class ClassroomCreate(BaseModel):
    name: str = Field(..., min_length=3, description="nome da turma")

# define o esquema de saida retornado pelo backend
class ClassroomResponse(BaseModel):
    id: str
    name: str
    teacher_id: str
    invite_code: str
    is_open_for_enrollment: bool

    class Config:
        populate_by_name = True