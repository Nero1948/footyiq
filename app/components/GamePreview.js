'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const FALLBACK_PLAYERS = [
  {
    answer_player: 'NRL Legend',
    clue_1: 'I played my entire career at a single NRL club',
    clue_2: 'I represented my state in State of Origin more than 30 times',
    clue_3: 'I was named the competition\'s best player three times',
  },
];

// ms to spend on each clue before revealing the next
const CLUE_DELAY = 2200;
// ms to show the blurred reveal before moving to the next player
const REVEAL_DELAY = 3500;
// ms for the fade-out transition between players
const FADE_DURATION = 400;

export default function GamePreview({ players = [] }) {
  const roster = players.length > 0 ? players : FALLBACK_PLAYERS;

  const [playerIndex, setPlayerIndex] = useState(0);
  const [clueStep, setClueStep] = useState(0); // 0 = clue 1 visible, 1 = clue 2, 2 = clue 3, 3 = reveal
  const [fading, setFading] = useState(false);

  const current = roster[playerIndex];
  const clues = [current.clue_1, current.clue_2, current.clue_3];
  const visibleClues = Math.min(clueStep + 1, clues.length);
  const showReveal = clueStep >= clues.length;

  useEffect(() => {
    if (fading) return;

    const delay = showReveal ? REVEAL_DELAY : CLUE_DELAY;
    const t = setTimeout(() => {
      if (!showReveal) {
        setClueStep((s) => s + 1);
      } else {
        // Fade out, then switch to next player
        setFading(true);
        setTimeout(() => {
          setPlayerIndex((i) => (i + 1) % roster.length);
          setClueStep(0);
          setFading(false);
        }, FADE_DURATION);
      }
    }, delay);

    return () => clearTimeout(t);
  }, [clueStep, showReveal, fading, roster.length]);

  return (
    <div
      className="max-w-sm mx-auto w-full"
      style={{ opacity: fading ? 0 : 1, transition: `opacity ${FADE_DURATION}ms ease` }}
    >
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
        {clues.slice(0, visibleClues).map((clue, i) => (
          <div key={`${playerIndex}-${i}`} className={i === visibleClues - 1 && i > 0 ? 'animate-fade-slide-in' : ''}>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Clue {i + 1}</span>
            <p className="text-base font-semibold text-white leading-relaxed mt-1">{clue}</p>
          </div>
        ))}

        {/* Skeleton placeholders for unrevealed clues */}
        {!showReveal && Array.from({ length: clues.length - visibleClues }).map((_, i) => (
          <div key={`sk-${i}`}>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Clue {visibleClues + i + 1}</span>
            <div className="mt-1.5 h-4 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', width: `${65 + (i * 11) % 25}%` }} />
          </div>
        ))}
      </div>

      {/* Guess input / reveal */}
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
            <p
              className="text-2xl font-black select-none"
              style={{ color: 'rgba(0,230,118,0.3)', filter: 'blur(7px)', userSelect: 'none' }}
            >
              {current.answer_player}
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

      {/* Player dots */}
      {roster.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {roster.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === playerIndex ? '16px' : '6px',
                height: '6px',
                background: i === playerIndex ? '#00e676' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
