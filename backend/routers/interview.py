from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import InterviewSession, QAPair
from models.schemas import (
    StartInterviewRequest,
    QuestionResponse,
    AnswerRequest,
    FeedbackResponse,
    SessionSummary,
)
from services.ai_service import generate_question, evaluate_answer
import asyncio
from google.api_core.exceptions import ResourceExhausted
from tenacity import RetryError

router = APIRouter(prefix="/interview", tags=["interview"])

TOTAL_QUESTIONS = 5


@router.post("/start", response_model=QuestionResponse)
async def start_interview(req: StartInterviewRequest, db: Session = Depends(get_db)):
    session = InterviewSession(role=req.role, difficulty=req.difficulty)
    
    try:
        question = await asyncio.to_thread(
            generate_question, req.role, req.difficulty
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
    except (ResourceExhausted, RetryError):
        db.rollback()
        raise HTTPException(
            status_code=429,
            detail="Gemini API rate limit exceeded. Please wait ~30-60 seconds and try again."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate interview question: {str(e)}"
        )

    return QuestionResponse(
        session_id=session.id, 
        question=question, 
        question_number=1
    )


@router.post("/answer", response_model=FeedbackResponse)
async def submit_answer(req: AnswerRequest, db: Session = Depends(get_db)):
  session = (
      db.query(InterviewSession)
      .filter(InterviewSession.id == req.session_id)
      .first()
  )
  if not session:
    raise HTTPException(status_code=404, detail="Session not found")

  # 1. Safely evaluate the answer off-thread
  try:
    result = await asyncio.to_thread(
        evaluate_answer, session.role, req.question, req.answer
    )
  except ResourceExhausted:
    raise HTTPException(
        status_code=429,
        detail="API rate limit reached while evaluating answer. Please try again in a few seconds.",
    )
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error evaluating answer: {str(e)}"
    )

  # 2. Save QA pair to database
  qa = QAPair(
      session_id=session.id,
      question=req.question,
      answer=req.answer,
      feedback=result["feedback"],
      score=result["score"],
  )
  db.add(qa)
  db.commit()

  # 3. Check if interview is complete
  answered_count = (
      db.query(QAPair).filter(QAPair.session_id == session.id).count()
  )

  if answered_count >= TOTAL_QUESTIONS:
    session.finished = 1
    db.commit()
    return FeedbackResponse(
        feedback=result["feedback"],
        score=result["score"],
        next_question=None,
        finished=True,
    )

  # 4. Generate next question off-thread
  asked_already = [q.question for q in session.qa_pairs]

  try:
    next_q = await asyncio.to_thread(
        generate_question,
        session.role,
        session.difficulty,
        asked_already=asked_already,
    )
  except ResourceExhausted:
    raise HTTPException(
        status_code=429,
        detail="API rate limit reached while generating next question. Please try again in a few seconds.",
    )
  except Exception as e:
    raise HTTPException(
        status_code=500, detail=f"Error generating next question: {str(e)}"
    )

  return FeedbackResponse(
      feedback=result["feedback"],
      score=result["score"],
      next_question=next_q,
      finished=False,
  )


@router.get("/session/{session_id}", response_model=SessionSummary)
async def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionSummary(
        session_id=session.id,
        role=session.role,
        difficulty=session.difficulty,
        finished=bool(session.finished),
        qa_pairs=session.qa_pairs,
    )


@router.get("/sessions")
async def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).all()
    return [
        {
            "session_id": s.id,
            "role": s.role,
            "difficulty": s.difficulty,
            "finished": bool(s.finished),
            "created_at": s.created_at,
        }
        for s in sessions
    ]