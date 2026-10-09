from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship 
from datetime import datetime
from database import Base

class InterviewSession(Base):
    __tablename__ = "interview_session"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False)
    difficulty = Column(String, default="medium")
    finished = Column(Integer, default=0)

    qa_pairs = relationship("QAPair", back_populates="session", cascade="all, delete-orphan")

class QAPair(Base):
    __tablename__ = "qa_pairs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_session.id"),nullable=False)
    question = Column(String, nullable=False)
    answer = Column(String, nullable=False)
    feedback = Column(String, nullable=False)
    score = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="qa_pairs")
    