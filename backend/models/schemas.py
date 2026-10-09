from pydantic import BaseModel
from typing import Optional


class StartInterviewRequest(BaseModel):
    role: str
    difficulty: Optional[str] = "medium"


class QuestionResponse(BaseModel):
    session_id: int
    question: str
    question_number: int


class AnswerRequest(BaseModel):
    session_id: int
    question: str
    answer: str


class FeedbackResponse(BaseModel):
    feedback: str
    score: int  # 1-10
    next_question: Optional[str] = None
    finished: bool = False

class QAPairOut(BaseModel):
    question:str
    answer:str
    feedback:str
    score:int

    class Config:
        from_attributes: True

class SessionSummary(BaseModel):
    session_id: int
    role:str
    difficulty:str
    finished:bool
    qa_pairs: list[QAPairOut]

    class Config:
        from_attributes = True
