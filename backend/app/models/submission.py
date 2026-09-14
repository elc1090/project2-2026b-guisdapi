from pydantic import BaseModel, Field

# define o esquema de entrada enviado pelo aluno
class SubmissionCreate(BaseModel):
    option_selected: str = Field(..., description="opcao escolhida pelo aluno")
    reasoning: str = Field(..., min_length=10, description="raciocinio obrigatorio do aluno") # obrigatorio e com minimo de 10 caracteres

# define o esquema de saida retornado ao aluno apos o envio
class SubmissionResponse(BaseModel):
    id: str
    is_correct: bool
    correct_answer: str
    streak_updated: int
    score_earned: int = 0

    class Config:
        populate_by_name = True