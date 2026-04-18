'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DEMO_CLUES = [
  "I played my entire career at a single NRL club",
  "I represented my state in State of Origin more than 30 times",
  "I was named the competition's best player three times",
];

// Step timing in ms: how long to show each step before moving on
const STEP_DELAYS = [2200, 2200, 2200, 3500];

export default function GamePreview() {
  const [step, setStep] = useState(0);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (resetting) {
      const t = setTimeout(() => {
        setStep(0);
        setResetting(false);
      }, 800);
      return () => clearTimeout(t);
    }

    const delay = STEP_DELAYS[step] ?? 3500;
    const t = setTimeout(() => {
      if (step < STEP_DELAYS.length - 1) {
        setStep((s) => s + 1);
      } else {
        setResetting(true);
      }
    }, delay);

    return () => clearTimeout(t);
  }, [step, resetting]);

  const visibleClues = Math.min(step + 1, DEMO_CLUES.length);
  const showReveal = step >= DEMO_CLUES.length;

  return (
    <div className="max-w-sm mx-auto w-full" style={{ opacity: resetting ? 0 : 1, transition: 'opacity 0.4s ease' }}>

      {/* Card header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e676]" />
          </span>
          <span className="text-xs text-gray-500 font-medium">Live demo</span>
        </div>
        <span className="text-xs text-gray-600">Clue {visibleClues} of 6</span>
      </div>

      {/* Clue card */}
      <div
        className="rounded-2xl p-5 space-y-4 mb-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {DEMO_CLUES.slice(0, visibleClues).map((clue, i) => (
          <div key={i} className={i === visibleClues - 1 && i > 0 ? 'animate-fade-slide-in' : ''}>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Clue {i + 1}</span>
            </div>
            <p className="text-base font-semibold text-white leading-relaxed">{clue}</p>
          </div>
        ))}

        {/* Skeleton clues — greyed out placeholders */}
        {!showReveal && Array.from({ length: DEMO_CLUES.length - visibleClues }).map((_, i) => (
          <div key={`sk-${i}`}>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Clue {visibleClues + i + 1}</span>
            <div className="mt-1.5 h-4 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', width: `${65 + (i * 11) % 25}%` }} />
          </div>
        ))}
      </div>

      {/* Guess input area */}
      {!showReveal ? (
        <div className="flex gap-2">
          <div
            className="flex-1 rounded-xl px-4 py-3 text-sm text-gray-600 select-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            Who is this player…
          </div>
          <div
            className="font-semibold px-5 py-3 rounded-xl text-sm text-gray-600 select-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Lock it in
          </div>
        </div>
      ) : (
        <div className="animate-fade-slide-in space-y-3">
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)' }}
          >
            <p className="text-xs text-gray-500 mb-1">Can you guess who it is?</p>
            <p className="text-2xl font-black tracking-widest select-none" style={{ color: 'rgba(0,230,118,0.25)', filter: 'blur(6px)', userSelect: 'none' }}>
              Cameron Smith
            </p>
          </div>
          <Link
            href="/play"
            className="block w-full text-center font-black py-3.5 rounded-xl active:scale-95 transition-transform text-base"
            style={{ background: '#00e676', color: '#000' }}
          >
            Play today&apos;s game →
          </Link>
        </div>
      )}

    </div>
  );
}
