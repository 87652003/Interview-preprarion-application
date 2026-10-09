import json
import os
import google.generativeai as genai
from dotenv import load_dotenv
from google.api_core.exceptions import ResourceExhausted
from tenacity import RetryError, retry, retry_if_exception_type, stop_after_attempt, wait_exponential

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

MODEL_NAME = "gemini-3.6-flash"

model = genai.GenerativeModel(MODEL_NAME)
json_model = genai.GenerativeModel(
    MODEL_NAME, generation_config={"response_mime_type": "application/json"}
)

# Retry up to 3 times, waiting up to 10 seconds between attempts
retry_decorator = retry(
    retry=retry_if_exception_type((ResourceExhausted, Exception)),
    wait=wait_exponential(multiplier=1.5, min=2, max=10),
    stop=stop_after_attempt(3),
    reraise=True  # Reraise original exception instead of wrapping in RetryError
)

@retry_decorator
def generate_question(
    role: str,
    difficulty: str = "medium",
    asked_already: list[str] | None = None,
) -> str:
    asked_already = asked_already or []
    prompt = f"""You are an interviewer conducting a mock interview for a {role} position.
Difficulty level: {difficulty}.
Questions already asked: {asked_already}

Generate ONE new, relevant interview question for this role. Do not repeat
previous questions. Reply with ONLY the question text, nothing else."""

    try:
      response = model.generate_content(prompt)
      return response.text.strip()
    except (ResourceExhausted, RetryError):
       return f"Can you explain a challenging technical problem you solved in your previous role as a {role}?"

@retry_decorator
def evaluate_answer(role: str, question: str, answer: str) -> dict:
    prompt = f"""You are an interviewer evaluating a candidate's answer for a {role} position.

Question: {question}
Candidate's answer: {answer}

Evaluate the answer. Reply with valid JSON in this exact structure:
{{"score": 8, "feedback": "2-3 sentences of specific, constructive feedback"}}"""

    try:
      response = json_model.generate_content(prompt)
      return json.loads(response.text)
    except (ResourceExhausted, RetryError):
      # Fallback evaluation when rate limit is hit
      return {
          "score": 7,
          "feedback": (
              "Good effort! (Note: Automated scoring fallback active due to API"
              " rate limits)."
          ),
      }