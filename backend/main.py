from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from models import db_models
from routers import interview

Base.metadata.create_all(bind=engine)


app = FastAPI(title="AI Interview Prep API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router)


@app.get("/")
async def root():
    return {"status": "ok", "message": "AI Interview Prep API is running"}
