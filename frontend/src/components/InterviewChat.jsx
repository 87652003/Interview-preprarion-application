import { useEffect, useState, useRef } from "react";
import { startInterview, submitAnswer } from "../api/interviewApi";
import InterviewerAvatar from "./InterviewerAvatar";
import Breadcrumbs from "./Breadcrumbs";

const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "DevOps Engineer",
  "Mobile Developer (Android/iOS)",
  "QA Engineer",
  "Product Manager",
  "UI/UX Designer",
];

const DIFFICULTIES = ["easy", "medium", "hard"];
const TOTAL_QUESTIONS = 5;
const INTRO_QUESTION =
  "Hello! Thanks for joining today. Before we dive into technical concepts, could you please tell me a bit about yourself and your background?";
const TRANSITION_LINE =
  "Thanks for sharing that! Let's move into our main questions.";

const STORAGE_KEY = "ai_mock_interview_session";

const getCurrentStep = (finished, started, introPhase) => {
  if (finished) return "results";
  if (!started) return "setup";
  if (introPhase) return "intro";
  return "interview";
};

export default function InterviewChat() {
  // Helper to load persisted state safely
  const getSavedState = (key, fallback) => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      return saved !== null ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  // State with lazy local storage restoration
  const [role, setRole] = useState(() => getSavedState("role", ROLES[0]));
  const [difficulty, setDifficulty] = useState(() =>
    getSavedState("difficulty", "medium")
  );
  const [sessionId, setSessionId] = useState(() => getSavedState("sessionId", null));
  const [started, setStarted] = useState(() => getSavedState("started", false));
  const [finished, setFinished] = useState(() => getSavedState("finished", false));
  const [question, setQuestion] = useState(() => getSavedState("question", ""));
  const [history, setHistory] = useState(() => getSavedState("history", []));
  const [introPhase, setIntroPhase] = useState(() =>
    getSavedState("introPhase", true)
  );

  const currentStep = getCurrentStep(finished, started, introPhase);

  // Transient runtime state (does not need local storage)
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);

  const recognitionRef = useRef(null);
  const firstQuestionPromiseRef = useRef(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_role`, JSON.stringify(role));
      localStorage.setItem(`${STORAGE_KEY}_difficulty`, JSON.stringify(difficulty));
      localStorage.setItem(`${STORAGE_KEY}_sessionId`, JSON.stringify(sessionId));
      localStorage.setItem(`${STORAGE_KEY}_started`, JSON.stringify(started));
      localStorage.setItem(`${STORAGE_KEY}_finished`, JSON.stringify(finished));
      localStorage.setItem(`${STORAGE_KEY}_question`, JSON.stringify(question));
      localStorage.setItem(`${STORAGE_KEY}_history`, JSON.stringify(history));
      localStorage.setItem(`${STORAGE_KEY}_introPhase`, JSON.stringify(introPhase));
    } catch (e) {
      console.warn("Could not save interview state to localStorage", e);
    }
  }, [role, difficulty, sessionId, started, finished, question, history, introPhase]);

  // Clear local storage helper
  const clearInterviewSession = () => {
    const keys = [
      "role",
      "difficulty",
      "sessionId",
      "started",
      "finished",
      "question",
      "history",
      "introPhase",
    ];
    keys.forEach((key) => localStorage.removeItem(`${STORAGE_KEY}_${key}`));
  };

  const speak = (text) => {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window) || !text) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onstart = () => setIsInterviewerSpeaking(true);
      utterance.onend = () => {
        setIsInterviewerSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsInterviewerSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResult = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setAnswer(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setAnswer("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleStart = async () => {
    clearInterviewSession(); // Clear any stale session data
    setLoading(true);
    setIntroPhase(true);
    setQuestion(INTRO_QUESTION);
    setStarted(true);

    firstQuestionPromiseRef.current = startInterview(role, difficulty);

    setLoading(false);
    await speak(INTRO_QUESTION);
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setLoading(true);

    if (introPhase) {
      setLoadingLabel("Preparing your first question...");

      const data = await firstQuestionPromiseRef.current;
      setSessionId(data.session_id);
      setAnswer("");
      setIntroPhase(false);

      setLoadingLabel("Interviewer is responding...");
      await speak(TRANSITION_LINE);

      setQuestion(data.question);
      setLoading(false);
      setLoadingLabel("");

      await speak(data.question);
      return;
    }

    setLoadingLabel("Interviewer is reviewing your answer...");
    const data = await submitAnswer(sessionId, question, answer);

    const newHistory = [
      ...history,
      { question, answer, feedback: data.feedback, score: data.score },
    ];
    setHistory(newHistory);
    setAnswer("");

    setLoadingLabel("Interviewer is giving feedback...");
    await speak(`Feedback: ${data.feedback}`);

    if (data.finished) {
      setFinished(true);
    } else {
      setQuestion(data.next_question);
      setLoadingLabel("Interviewer asking next question...");
      await speak(data.next_question);
    }

    setLoading(false);
    setLoadingLabel("");
  };

  const handleRestart = () => {
    clearInterviewSession();
    setSessionId(null);
    setStarted(false);
    setFinished(false);
    setHistory([]);
    setQuestion("");
    setAnswer("");
    setIntroPhase(true);
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
          {/* Breadcrumbs Component */}
          <Breadcrumbs
            currentStep={currentStep}
            onNavigateToStart={handleRestart}
          />
          <h2 className="mb-2 text-3xl font-bold text-slate-800">
            Start a Mock Interview
          </h2>

          {!speechSupported && (
            <p className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
              Voice input is not supported in this browser - try Chrome or Edge
              for full functionality. You can still type answers.
            </p>
          )}

          <label htmlFor="role" className="mb-2 block text-sm font-semibold text-slate-700">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <br />
          <br />

          <label htmlFor="difficulty" className="mb-2 block text-sm font-semibold text-slate-700">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 capitalize text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <br />
          <br />

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Initializing..." : "Start Interview"}
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    const avgScore = (
      history.reduce((sum, h) => sum + h.score, 0) / history.length
    ).toFixed(1);

    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumbs Component */}
          <Breadcrumbs
            currentStep={currentStep}
            onNavigateToStart={handleRestart}
          />
          <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              🎉
            </div>
            <h2 className="text-3xl font-bold text-slate-800">
              Interview Complete
            </h2>
            <p className="mt-2 text-slate-500">Great job! Here's how you performed.</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Session ID:</p>
                <p className="mt-1 font-bold text-slate-800">{sessionId}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Role</p>
                <p className="mt-1 font-bold text-slate-800">{role}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Difficulty</p>
                <p className="mt-1 font-bold capitalize text-slate-800">
                  {difficulty}
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 p-4 sm:col-span-3">
                <p className="text-sm text-indigo-500">Average Score</p>
                <p className="mt-1 text-2xl font-bold text-indigo-600">
                  {avgScore}/10
                </p>
              </div>
            </div>

            <hr className="my-6" />

            <div className="space-y-4 text-left">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-semibold text-slate-800">
                      Q{i + 1}: {h.question}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                        h.score >= 8
                          ? "bg-green-100 text-green-700"
                          : h.score >= 5
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {h.score}/10
                    </span>
                  </div>
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Your Answer
                    </p>
                    <p className="mt-2 text-slate-700">{h.answer}</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
                      AI Feedback
                    </p>
                    <p className="mt-2 leading-relaxed text-slate-600">
                      {h.feedback}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRestart}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-indigo-700"
            >
              Start New Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumbs Component */}
        <Breadcrumbs
          currentStep={currentStep}
          onNavigateToStart={handleRestart}
        />
        <div className="mb-6 items-center justify-between rounded-2xl bg-slate-900 p-6 shadow-md">
          <InterviewerAvatar speaking={isInterviewerSpeaking} />
          
        </div>
        
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-md">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{role}</h2>
              <p className="mt-1 text-sm capitalize text-slate-500">
                Difficulty: {difficulty}
              </p>
            </div>
            <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
              {introPhase
                ? "Introduction"
                : `Question ${history.length + 1} / ${TOTAL_QUESTIONS}`}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {history.map((h, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-5 opacity-75 shadow-sm"
            >
              <p className="font-semibold text-slate-800">
                Q{i + 1}: {h.question}
              </p>
              <div className="mt-3 rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-600">
                  Your answer
                </p>
                <p className="mt-1 text-slate-700">{h.answer}</p>
              </div>
              <div className="mt-3">
                <span className="font-semibold text-indigo-600">
                  Feedback ({h.score}/10)
                </span>
                <p className="mt-1 text-sm text-slate-600">{h.feedback}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
              AI
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-semibold leading-relaxed text-slate-800">
                  {introPhase
                    ? "Introductory Question: "
                    : `Q${history.length + 1}: `}
                  {question}
                </p>
                <button
                  onClick={() => speak(question)}
                  title="Replay question"
                  className="rounded-full bg-slate-100 p-2 text-lg transition hover:bg-indigo-100"
                >
                  🔊
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="answer" className="mb-2 block text-sm font-semibold text-slate-700">
              Your Answer
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
              placeholder="Type your answer, or click the mic to speak it..."
              className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {speechSupported && (
              <button
                onClick={toggleListening}
                className={`rounded-xl px-5 py-3 font-semibold transition ${
                  isListening
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {isListening ? "⏹ Stop Listening" : "🎤 Speak Answer"}
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !answer.trim()}
              className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? loadingLabel || "Evaluating..."
                : introPhase
                ? "Submit Introduction"
                : history.length + 1 === TOTAL_QUESTIONS
                ? "Finish Interview"
                : "Submit Answer"}
            </button>

            
          </div>
          
        </div>
        
       <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={handleRestart}
          className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          Restart Session
        </button>
      </div>
      </div>
    </div>
  );
}