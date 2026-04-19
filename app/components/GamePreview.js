'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const FALLBACK_SCRIPTS = [
  {
    name: 'Cameron Smith',
    label: 'Solved in 2 clues',
    clues: [
      'I played over 400 NRL games for a single club — a record that still stands',
      'I captained Queensland in State of Origin for more than a decade',
    ],
    wrongGuesses: ['Danny Buderus'],
  },
  {
    name: 'Johnathan Thurston',
    label: 'Solved in 4 clues',
    clues: [
      'I was born in the Northern Territory',
      'I won the Dally M Medal four times — more than any player in history',
      'I spent my entire NRL career in Far North Queensland',
      'I kicked the winning field goal in the 2015 NRL Grand Final',
    ],
    wrongGuesses: ['Greg Inglis', 'Billy Slater', 'Matt Scott'],
  },
  {
    name: 'Andrew Johns',
    label: 'Solved in 6 clues',
    clues: [
      'I grew up in the NSW Hunter Valley',
      'I won two NRL premierships with the same club',
      'I won three Dally M Medals during my career',
      'I was named the greatest NRL player of the modern era',
      'My brother also played NRL at the same club as me',
      'My nickname is "Joey"',
    ],
    wrongGuesses: ['Matty Johns', 'Brad Fittler', 'Mark Hughes', 'Laurie Daley', 'Kurt Gidley'],
  },
];

// Wrong guess pools for each demo game (plausible NRL names that won't match real answers)
const WRONG_GUESS_POOLS = [
  ['James Tedesco', 'Nathan Cleary'],
  ['Latrell Mitchell', 'Ryan Papenhuyzen', 'Tom Trbojevic'],
  ['Kalyn Ponga', 'Daly Cherry-Evans', 'Nicho Hynes', 'Reece Walsh', 'Dylan Brown'],
];

// How many clues each of the 3 demo games "solves" at
const SOLVE_AT = [2, 4, 6];

function buildScripts(players) {
  if (!players || players.length < 3) return FALLBACK_SCRIPTS;
  return players.slice(0, 3).map((p, i) => {
    const solveAt = SOLVE_AT[i];
    const allClues = [p.clue_1, p.clue_2, p.clue_3, p.clue_4, p.clue_5, p.clue_6].filter(Boolean);
    const clues = allClues.slice(0, solveAt);
    if (clues.length < solveAt) return FALLBACK_SCRIPTS[i]; // not enough clues in DB
    return {
      name: p.answer_player,
      label: `Solved in ${solveAt} clue${solveAt === 1 ? '' : 's'}`,
      clues,
      wrongGuesses: WRONG_GUESS_POOLS[i].slice(0, solveAt - 1),
    };
  });
}

// Timing constants (ms)
const THINK_MS = 2000;      // pause before typing starts
const TYPE_MS = 65;          // ms per character typed
const POST_TYPE_MS = 700;    // pause after typing before submit
const WRONG_HOLD_MS = 1500;  // how long to show the wrong badge
const NEW_CLUE_PAUSE_MS = 1400; // pause after new clue appears before next typing
const SUCCESS_HOLD_MS = 4000;   // how long success screen shows
const FADE_MS = 500;            // fade between games

export default function GamePreview({ players = [] }) {
  const scripts = buildScripts(players);

  const [gameIdx, setGameIdx] = useState(0);
  const [revealedClues, setRevealedClues] = useState(1);
  const [wrongGuesses, setWrongGuesses] = useState([]); // wrong text per clue index
  const [typingText, setTypingText] = useState('');
  const [phase, setPhase] = useState('think'); // think | typing | wrong | new_clue | success | fading
  const [fading, setFading] = useState(false);

  const timerRef = useRef(null);
  const clueListRef = useRef(null);

  const script = scripts[gameIdx];
  const guessIndex = wrongGuesses.length; // which guess we're on
  const isCorrectGuess = guessIndex >= script.wrongGuesses.length;
  const targetText = isCorrectGuess ? script.name : script.wrongGuesses[guessIndex];

  // Auto-scroll clue list to bottom when a new clue is revealed
  useEffect(() => {
    if (clueListRef.current) {
      clueListRef.current.scrollTop = clueListRef.current.scrollHeight;
    }
  }, [revealedClues]);

  // Clear timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Phase state machine
  useEffect(() => {
    clearTimeout(timerRef.current);

    if (phase === 'think') {
      timerRef.current = setTimeout(() => setPhase('typing'), THINK_MS);

    } else if (phase === 'typing') {
      if (typingText.length < targetText.length) {
        timerRef.current = setTimeout(() => {
          setTypingText(targetText.slice(0, typingText.length + 1));
        }, TYPE_MS);
      } else {
        timerRef.current = setTimeout(() => {
          if (isCorrectGuess) {
            setPhase('success');
          } else {
            setWrongGuesses((prev) => [...prev, typingText]);
            setTypingText('');
            setPhase('wrong');
          }
        }, POST_TYPE_MS);
      }

    } else if (phase === 'wrong') {
      timerRef.current = setTimeout(() => {
        setRevealedClues((n) => n + 1);
        setPhase('new_clue');
      }, WRONG_HOLD_MS);

    } else if (phase === 'new_clue') {
      timerRef.current = setTimeout(() => setPhase('think'), NEW_CLUE_PAUSE_MS);

    } else if (phase === 'success') {
      timerRef.current = setTimeout(() => {
        setFading(true);
        timerRef.current = setTimeout(() => {
          setGameIdx((i) => (i + 1) % scripts.length);
          setRevealedClues(1);
          setWrongGuesses([]);
          setTypingText('');
          setFading(false);
          setPhase('think');
        }, FADE_MS);
      }, SUCCESS_HOLD_MS);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, typingText]);

  const showSuccess = phase === 'success';

  return (
    <div className="max-w-sm mx-auto w-full">

      {/* Section label — big and clear on mobile */}
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3"
          style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)' }}
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e676]" />
          </span>
          <span className="text-sm font-bold tracking-wide" style={{ color: '#00e676' }}>LIVE DEMO</span>
        </div>
        <p className="text-xl sm:text-2xl font-black text-white">{script.label}</p>
      </div>

      {/* Fixed-height demo card — never shifts page content */}
      <div
        style={{
          opacity: fading ? 0 : 1,
          transition: `opacity ${FADE_MS}ms ease`,
          height: '420px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {showSuccess ? (
          /* ── Success state ── */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-slide-in">
            <div className="text-5xl mb-3">🏉</div>
            <p className="text-xs font-bold tracking-widest mb-1" style={{ color: '#00e676' }}>GOT IT!</p>
            <h2 className="text-3xl font-black text-white mb-2">{script.name}</h2>
            <p className="text-sm text-gray-500 mb-6">
              Solved in {revealedClues} {revealedClues === 1 ? 'clue' : 'clues'}
            </p>
            <Link
              href="/play"
              className="font-black py-3 px-8 rounded-xl text-base active:scale-95 transition-transform"
              style={{ background: '#00e676', color: '#000' }}
            >
              Play today&apos;s game →
            </Link>
          </div>
        ) : (
          <>
            {/* ── Clue list (scrollable, takes up available space) ── */}
            <div
              ref={clueListRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ scrollBehavior: 'smooth' }}
            >
              {script.clues.slice(0, revealedClues).map((clueText, i) => {
                const isNewest = i === revealedClues - 1;
                const wrongForThisClue = wrongGuesses[i];
                return (
                  <div
                    key={`${gameIdx}-${i}`}
                    className={isNewest && revealedClues > 1 ? 'animate-fade-slide-in' : ''}
                    style={{
                      borderRadius: '10px',
                      padding: '12px 14px',
                      background: isNewest ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.02)',
                      borderTop: `1px solid ${isNewest ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      borderRight: `1px solid ${isNewest ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      borderBottom: `1px solid ${isNewest ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      borderLeft: `3px solid ${isNewest ? '#00e676' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Clue {i + 1}
                    </span>
                    <p className="text-sm font-semibold text-white leading-relaxed mt-1">{clueText}</p>
                    {wrongForThisClue && (
                      <div
                        className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                      >
                        <span>✕</span>
                        <span>{wrongForThisClue}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Skeleton placeholders for unrevealed clues */}
              {script.clues.slice(revealedClues).map((_, i) => (
                <div key={`sk-${i}`} style={{ borderRadius: '10px', padding: '12px 14px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Clue {revealedClues + i + 1}
                  </span>
                  <div
                    className="mt-1.5 h-3.5 rounded"
                    style={{ background: 'rgba(255,255,255,0.04)', width: `${60 + (i * 13) % 28}%` }}
                  />
                </div>
              ))}
            </div>

            {/* ── Typing input (fixed at bottom) ── */}
            <div
              className="p-3 flex gap-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}
            >
              <div
                className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white select-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  minHeight: '40px',
                }}
              >
                {typingText || <span className="text-gray-600">Who is this player…</span>}
                {phase === 'typing' && (
                  <span
                    className="inline-block w-0.5 h-4 ml-0.5 align-text-bottom"
                    style={{ background: '#00e676', animation: 'blink 0.8s step-end infinite' }}
                  />
                )}
              </div>
              <div
                className="font-semibold px-4 py-2.5 rounded-xl text-sm text-gray-600 select-none whitespace-nowrap"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Lock it in
              </div>
            </div>
          </>
        )}
      </div>

      {/* Game dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {scripts.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === gameIdx ? '16px' : '6px',
              height: '6px',
              background: i === gameIdx ? '#00e676' : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
