import React, { useState, useEffect } from 'react';

export default function InterviewerAvatar({ speaking: externalSpeaking }) {
  // Test fallback: If external prop is not provided/functional, allow clicking to test speaking
  const [internalSpeaking, setInternalSpeaking] = useState(false);
  const isSpeaking = externalSpeaking ?? internalSpeaking;

  // 0: Closed, 1: Small, 2: Wide, 3: Medium
  const [mouthFrame, setMouthFrame] = useState(0);

  useEffect(() => {
    let interval;
    if (isSpeaking) {
      interval = setInterval(() => {
        setMouthFrame((prev) => (prev % 3) + 1); // Cycles 1 -> 2 -> 3
      }, 100);
    } else {
      setMouthFrame(0);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Container */}
      <div 
        onClick={() => setInternalSpeaking(!internalSpeaking)}
        title="Click avatar to manually test mouth animation"
        className={`relative cursor-pointer rounded-3xl bg-slate-900/90 p-4 backdrop-blur-md border border-slate-800 shadow-2xl transition-all duration-300 ${isSpeaking ? 'ring-2 ring-indigo-500 shadow-indigo-500/20' : ''}`}
      >
        <svg
          viewBox="0 0 400 400"
          className="w-72 h-72 md:w-80 md:h-80 drop-shadow-xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
            <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1e24" />
              <stop offset="50%" stopColor="#111115" />
              <stop offset="100%" stopColor="#08080a" />
            </linearGradient>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f3d0be" />
              <stop offset="100%" stopColor="#e2b59c" />
            </linearGradient>
            <linearGradient id="deskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2c323f" />
              <stop offset="100%" stopColor="#1a1d24" />
            </linearGradient>
            <linearGradient id="tieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>

          {/* Background */}
          <rect x="10" y="10" width="380" height="380" rx="20" fill="url(#bgGrad)" />
          <path d="M 20 280 L 380 280" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

          {/* Body & Clothes */}
          <g>
            <polygon points="180,210 200,240 220,210 200,215" fill="#ffffff" />
            <polygon points="195,215 205,215 210,285 200,295 190,285" fill="url(#tieGrad)" />
            <polygon points="194,213 206,213 203,222 197,222" fill="#7f1d1d" />
            <path d="M 120 320 Q 130 210 175 210 L 200 255 L 225 210 Q 270 210 280 320 Z" fill="url(#suitGrad)" />
            <path d="M 135 220 L 175 210 L 190 260 L 165 240 Z" fill="#2d2d35" />
            <path d="M 265 220 L 225 210 L 210 260 L 235 240 Z" fill="#2d2d35" />
            <rect x="184" y="180" width="32" height="38" rx="4" fill="#d49e83" />
          </g>

          {/* Head & Face */}
          <g>
            <ellipse cx="146" cy="155" rx="7" ry="12" fill="#e2b59c" />
            <ellipse cx="254" cy="155" rx="7" ry="12" fill="#e2b59c" />
            <path d="M 150 140 Q 150 95 200 95 Q 250 95 250 140 Q 250 175 228 190 Q 200 200 172 190 Q 150 175 150 140 Z" fill="url(#skinGrad)" />
            <path d="M 148 135 C 145 110, 160 85, 200 85 C 240 85, 255 110, 252 135 C 246 100, 225 90, 200 92 C 175 90, 154 100, 148 135 Z" fill="#4a3728" />
            <path d="M 165 132 Q 178 128 188 133" stroke="#362419" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 212 133 Q 222 128 235 132" stroke="#362419" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Eyes */}
            <g fill="#1e293b">
              <ellipse cx="177" cy="142" rx="5" ry="4" />
              <ellipse cx="223" cy="142" rx="5" ry="4" />
              <circle cx="175" cy="140" r="1.5" fill="#ffffff" />
              <circle cx="221" cy="140" r="1.5" fill="#ffffff" />
            </g>

            {/* Nose */}
            <path d="M 200 138 L 197 160 L 203 160 Z" fill="#d49e83" opacity="0.6" />
            <path d="M 195 162 Q 200 166 205 162" stroke="#b87d63" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* DIRECT EXPLICIT MOUTH SHAPES */}
            {mouthFrame === 0 && (
              /* Closed Mouth */
              <path d="M 186 175 Q 200 178 214 175" stroke="#8c4a32" strokeWidth="3" strokeLinecap="round" fill="none" />
            )}

            {mouthFrame === 1 && (
              /* Small Open Mouth */
              <g>
                <ellipse cx="200" cy="176" rx="10" ry="4" fill="#450a0a" stroke="#b87d63" strokeWidth="1.5" />
                <path d="M 193 174 Q 200 176 207 174" stroke="#ffffff" strokeWidth="1.5" fill="none" />
              </g>
            )}

            {mouthFrame === 2 && (
              /* Wide Open Mouth */
              <g>
                <ellipse cx="200" cy="178" rx="14" ry="9" fill="#450a0a" stroke="#b87d63" strokeWidth="1.5" />
                <path d="M 190 173 Q 200 176 210 173" stroke="#ffffff" strokeWidth="2" fill="none" />
                <ellipse cx="200" cy="183" rx="6" ry="3" fill="#ef4444" />
              </g>
            )}

            {mouthFrame === 3 && (
              /* Medium Open Mouth */
              <g>
                <ellipse cx="200" cy="177" rx="12" ry="6" fill="#450a0a" stroke="#b87d63" strokeWidth="1.5" />
                <path d="M 191 173 Q 200 175 209 173" stroke="#ffffff" strokeWidth="2" fill="none" />
              </g>
            )}
          </g>

          {/* Desk */}
          <path d="M 30 280 L 370 280 L 390 380 L 10 380 Z" fill="url(#deskGrad)" />
          <path d="M 30 280 L 370 280 L 370 284 L 30 284 Z" fill="#475569" />

          {/* Hands */}
          <g transform="translate(0, -10)">
            <path d="M 125 315 L 165 295 L 180 315 Z" fill="#111115" />
            <path d="M 275 315 L 235 295 L 220 315 Z" fill="#111115" />
            <g fill="#e2b59c" stroke="#c08b72" strokeWidth="1">
              <rect x="175" y="293" width="22" height="14" rx="6" transform="rotate(-10 175 293)" />
              <rect x="203" y="290" width="22" height="14" rx="6" transform="rotate(10 203 290)" />
              <ellipse cx="200" cy="300" rx="18" ry="10" />
            </g>
          </g>
        </svg>

        {isSpeaking && (
          <div className="absolute top-6 right-6 flex items-end gap-1 h-6">
            <span className="w-1 bg-indigo-500 animate-[bounce_0.6s_infinite_100ms] h-3 rounded-full"></span>
            <span className="w-1 bg-indigo-400 animate-[bounce_0.6s_infinite_300ms] h-6 rounded-full"></span>
            <span className="w-1 bg-indigo-500 animate-[bounce_0.6s_infinite_200ms] h-4 rounded-full"></span>
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <h3 className="text-base font-bold tracking-wide flex items-center justify-center gap-2">
          Elon <span className="text-xs font-normal px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI Interviewer</span>
        </h3>
        <p className="text-xs mt-1 font-medium text-indigo-400">
          {isSpeaking ? "Speaking (Click avatar to pause)" : "Listening...."}
        </p>

        
      </div>
      
    </div>
  );
}