
# AI Interview Prep App — Starter Structure

## Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then add your ANTHROPIC_API_KEY
uvicorn main:app --reload
```
API runs at http://localhost:8000 — check http://localhost:8000/docs for interactive testing.

## Frontend (React + Vite)

The `frontend/src` folder here has the core files already written.
Create the Vite project shell, then drop these files in:

```bash
npm create vite@latest frontend -- --template react
```
When prompted to overwrite an existing directory, confirm — then copy in
`src/App.jsx`, `src/api/interviewApi.js`, and `src/components/InterviewChat.jsx`
from this starter (they're already written for you).

```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173

## What's already built
- `POST /interview/start` — generates the first question for a role
- `POST /interview/answer` — evaluates an answer, returns score + feedback + next question
- A working chat-style UI that drives this flow end to end

## Next steps
- Add a role picker (dropdown instead of free text) with predefined roles
- Persist sessions to a database (currently all state lives in React memory — refresh = lost progress)
- Add a "final results" screen summarizing the full interview
- Add voice input/output (Web Speech API) once the text flow feels solid

# Interview-preprarion-application
This is my first React + Python Application
 b87dea6aabac077f8cbfb528b8a61c5d31e5644a
