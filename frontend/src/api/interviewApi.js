const BASE_URL = "http://localhost:8000";

export async function startInterview(role, difficulty = "medium") {
  const res = await fetch(`${BASE_URL}/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, difficulty }),
  });
  if (!res.ok) throw new Error("Failed to start interview");
  return res.json();
}

export async function submitAnswer(sessionId, question, answer) {
  const res = await fetch(`${BASE_URL}/interview/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, question, answer }),
  });
  if (!res.ok) throw new Error("Failed to submit answer");
  return res.json();
}
