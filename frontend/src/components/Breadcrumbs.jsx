import React from "react";

const STEPS = [
  { id: "setup", label: "Setup" },
  { id: "intro", label: "Introduction" },
  { id: "interview", label: "Technical Q&A" },
  { id: "results", label: "Results" },
];

export default function Breadcrumbs({ currentStep, onNavigateToStart }) {
  const getStepStatus = (stepId) => {
    const order = ["setup", "intro", "interview", "results"];
    const currentIndex = order.indexOf(currentStep);
    const stepIndex = order.indexOf(stepId);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "upcoming";
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.id);

          return (
            <li key={step.id} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 font-medium text-slate-400">/</span>
              )}

              {status === "completed" && step.id === "setup" ? (
                <button
                  type="button"
                  onClick={onNavigateToStart}
                  className="font-semibold text-indigo-600 transition hover:text-indigo-800 hover:underline"
                >
                  {step.label}
                </button>
              ) : (
                <span
                  className={`font-semibold ${
                    status === "active"
                      ? "rounded-md bg-indigo-50 px-2.5 py-1 text-indigo-700"
                      : status === "completed"
                      ? "text-slate-600"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}