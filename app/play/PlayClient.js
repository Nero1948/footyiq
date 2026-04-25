'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';

const CONFETTI_COLOURS = ['#00e676', '#ffb800', '#ff4466', '#4499ff', '#cc44ff', '#ffffff'];
const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  color: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
  left: `${((i * 41 + 7) % 96) + 2}%`,
  duration: `${1.6 + (i % 9) * 0.22}s`,
  delay: `${(i % 11) * 0.06}s`,
  size: `${7 + (i % 5)}px`,
  round: i % 3 !== 0,
}));

const ls = {
  get: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, val); } catch {} },
};

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function getSecondsUntilMidnightAEST() {
  const now = new Date();
  const aestNow = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
  const aestMidnight = new Date(aestNow);
  aestMidnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((aestMidnight - aestNow) / 1000));
}

function buildShareText(gameNumber, solved, cluesUsed, totalTimeMs, rank, totalPlayers, streak) {
  const squares = solved
    ? [...Array(cluesUsed - 1).fill('⬛'), '🏉', ...Array(6 - cluesUsed).fill('⬜')]
    : Array(6).fill('⬛');
  const clueWord = cluesUsed === 1 ? 'clue' : 'clues';
  const lines = [`Set For Six #${gameNumber} 🏉`, squares.join(''), ''];
  if (solved) {
    lines.push(`TRY! Scored in ${cluesUsed} ${clueWord} · ${formatTime(totalTimeMs)}`);
    const extras = [];
    if (rank !== null && rank !== undefined && totalPlayers) extras.push(`🏅 #${rank} of ${totalPlayers}`);
    extras.push(`🔥 ${streak} day streak`);
    lines.push(extras.join(' · '));
  } else {
    lines.push(`Held up over the line · ${formatTime(totalTimeMs)}`);
    if (totalPlayers) lines.push(`${totalPlayers} players tried today`);
  }
  lines.push('');
  lines.push('Think you know league?');
  lines.push('https://www.setforsix.com');
  return lines.join('\n');
}

export default function PlayClient({ initialGame }) {
  const [deviceId, setDeviceId] = useState(null);
  // Derive initial UI state from server-provided initialGame so SSR HTML never
  // shows a loading spinner — the game structure is visible immediately.
  const [gameState, setGameState] = useState(initialGame ? 'playing' : 'error');
  const [game, setGame] = useState(initialGame ?? null);
  const [clues, setClues] = useState(initialGame ? [initialGame.clue_1] : []);
  const [wrongGuesses, setWrongGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [clueNumber, setClueNumber] = useState(1);
  const [gameOverData, setGameOverData] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [emailInput, setEmailInput] = useState('');
  const [emailState, setEmailState] = useState('idle');
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState(initialGame ? null : 'No game today. Check back tomorrow!');
  const [isGuessing, setIsGuessing] = useState(false);
  const [stats, setStats] = useState(null);
  const [yesterdayData, setYesterdayData] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [username, setUsername] = useState('Anonymous');
  const [usernameSaved, setUsernameSaved] = useState(false);

  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  // ── Streak ─────────────────────────────────────────────────────────────────

  const streak = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    if (!gameOverData?.solved || !game?.date) return 1;
    let s = 1;
    const base = new Date(game.date + 'T12:00:00Z');
    for (let i = 1; i <= 365; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const k = d.toISOString().split('T')[0];
      const r = ls.get(`setforsix_result_${k}`) || ls.get(`footyiq_result_${k}`);
      if (r) { try { if (JSON.parse(r).solved) { s++; } else break; } catch { break; } }
      else break;
    }
    return s;
  }, [gameOverData, game]);

  // ── Device ID + username ───────────────────────────────────────────────────

  useEffect(() => {
    let id = ls.get('setforsix_device_id') || ls.get('footyiq_device_id');
    if (!id) id = generateUUID();
    ls.set('setforsix_device_id', id);
    setDeviceId(id);
    const savedUsername = ls.get('setforsix_username');
    if (savedUsername) setUsername(savedUsername);
  }, []);

  // ── Hydration: check localStorage once deviceId is available ─────────────
  // game/clues are already seeded from initialGame; we only need to check
  // whether the user has already completed today's game.

  useEffect(() => {
    if (!deviceId) return;

    if (!initialGame) {
      setLoadError('No game today. Check back tomorrow!');
      setGameState('error');
      return;
    }

    const saved =
      ls.get(`setforsix_result_${initialGame.date}`) ||
      ls.get(`footyiq_result_${initialGame.date}`);
    if (saved) {
      try {
        setGameOverData(JSON.parse(saved));
        setGameState('done');
      } catch {
        // Corrupt save — stay in playing state; timer starts via the timer effect
      }
    }
    // Fresh game: timer starts via the timer effect once deviceId is known
  }, [deviceId, initialGame]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  // Only start after hydration (deviceId known) so the timer reference is valid.
  // Adding deviceId as a dep means the timer starts once localStorage is read
  // and we know whether the game is fresh or already done.

  useEffect(() => {
    if (gameState !== 'playing' || !deviceId) return;
    startTimeRef.current = performance.now();
    timerRef.current = setInterval(() => setElapsedMs(performance.now() - startTimeRef.current), 100);
    return () => clearInterval(timerRef.current);
  }, [gameState, deviceId]);

  // ── Autofocus ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (gameState === 'playing') inputRef.current?.focus();
  }, [gameState, clueNumber]);

  // ── Stats + yesterday when done ────────────────────────────────────────────

  useEffect(() => {
    if (gameState !== 'done') return;
    fetch('/api/stats').then(r => r.ok ? r.json() : null).then(d => d && setStats(d)).catch(() => {});
    fetch('/api/yesterday').then(r => r.ok ? r.json() : null).then(d => d && setYesterdayData(d)).catch(() => {});
  }, [gameState]);

  // ── Countdown to midnight AEST ─────────────────────────────────────────────

  useEffect(() => {
    if (gameState !== 'done') return;
    function tick() {
      const secs = getSecondsUntilMidnightAEST();
      const h = String(Math.floor(secs / 3600)).padStart(2, '0');
      const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
      const s = String(secs % 60).padStart(2, '0');
      setCountdown(`${h}:${m}:${s}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gameState]);

  // ── Finish game ────────────────────────────────────────────────────────────

  const finishGame = useCallback(
    async ({ solved, answer, cluesUsed, totalTimeMs, allGuesses, facts = [], drama = null, allClues = [] }) => {
      try {
        const currentUsername = ls.get('setforsix_username') || 'Anonymous';
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: game.id, deviceId, cluesUsed, totalTimeMs, guesses: allGuesses, solved, username: currentUsername }),
        });
        const submitData = await res.json();
        const rank = res.ok && submitData.success ? submitData.rank : null;
        const totalPlayers = res.ok && submitData.success ? submitData.totalPlayers : null;
        const percentile = res.ok && submitData.success ? submitData.percentile : null;
        const resultData = { solved, answer, cluesUsed, totalTimeMs, rank, totalPlayers, percentile, facts, drama, allClues };
        setGameOverData(resultData);
        setGameState('done');
        ls.set(`setforsix_result_${game.date}`, JSON.stringify(resultData));
        track('game_completed', { solved, clues_used: cluesUsed });
      } catch {
        const resultData = { solved, answer, cluesUsed, totalTimeMs, rank: null, totalPlayers: null, percentile: null, facts, drama, allClues };
        setGameOverData(resultData);
        setGameState('done');
        ls.set(`setforsix_result_${game.date}`, JSON.stringify(resultData));
        track('game_completed', { solved, clues_used: cluesUsed });
      } finally {
        setIsGuessing(false);
      }
    },
    [game, deviceId]
  );

  // ── Handle guess ───────────────────────────────────────────────────────────

  const handleGuess = useCallback(async () => {
    const guessText = currentGuess.trim();
    if (!guessText || isGuessing) return;
    const timeMs = Math.round(performance.now() - startTimeRef.current);
    setIsGuessing(true);
    setCurrentGuess('');
    try {
      const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, deviceId, guess: guessText, clueNumber, totalTimeMs: timeMs }),
      });
      const data = await res.json();
      if (!res.ok) { setCurrentGuess(guessText); setIsGuessing(false); return; }
      if (data.correct) {
        clearInterval(timerRef.current);
        await finishGame({ solved: true, answer: data.answer, cluesUsed: clueNumber, totalTimeMs: Math.round(performance.now() - startTimeRef.current), allGuesses: [...wrongGuesses, guessText], facts: data.facts || [], drama: data.drama || null, allClues: data.allClues || [] });
      } else if (data.failed) {
        clearInterval(timerRef.current);
        const allGuesses = [...wrongGuesses, guessText];
        setWrongGuesses(allGuesses);
        await finishGame({ solved: false, answer: data.answer, cluesUsed: 6, totalTimeMs: Math.round(performance.now() - startTimeRef.current), allGuesses, facts: data.facts || [], drama: data.drama || null, allClues: data.allClues || [] });
      } else {
        setWrongGuesses((prev) => [...prev, guessText]);
        setClues((prev) => [...prev, data.nextClue]);
        setClueNumber((prev) => prev + 1);
        setIsGuessing(false);
      }
    } catch {
      setCurrentGuess(guessText);
      setIsGuessing(false);
    }
  }, [currentGuess, isGuessing, game, deviceId, clueNumber, wrongGuesses, finishGame]);

  // ── Email signup ───────────────────────────────────────────────────────────

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setEmailState('loading');
    try {
      const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailInput.trim() }) });
      if (res.ok) {
        track('email_signup', { location: 'play_page' });
      }
      setEmailState(res.ok ? 'done' : 'error');
    } catch { setEmailState('error'); }
  }

  // ── Save username ──────────────────────────────────────────────────────────

  async function handleUsernameSave() {
    const trimmed = username.trim() || 'Anonymous';
    setUsername(trimmed);
    ls.set('setforsix_username', trimmed);
    if (game?.id && deviceId) {
      try {
        await fetch('/api/attempt/update-username', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, gameId: game.id, username: trimmed }),
        });
      } catch {
        // localStorage is updated — leaderboard will reflect on next submission
      }
    }
    setUsernameSaved(true);
    setTimeout(() => setUsernameSaved(false), 2000);
  }

  // ── Share result ───────────────────────────────────────────────────────────

  async function handleShare() {
    if (!game || !gameOverData) return;
    track('share_clicked', { solved: gameOverData.solved, clues_used: gameOverData.cluesUsed });
    const text = buildShareText(game.game_number, gameOverData.solved, gameOverData.cluesUsed, gameOverData.totalTimeMs, gameOverData.rank, gameOverData.totalPlayers, streak);

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // Fall back to clipboard if sharing is cancelled or unavailable.
      }
    }

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // ── Render: error ─────────────────────────────────────────────────────────

  if (gameState === 'error') {
    return (
      <div className="bg-texture min-h-screen flex items-center justify-center px-4">
        <p className="text-red-400 text-center text-lg">{loadError}</p>
      </div>
    );
  }

  // ── Render: game ───────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{
        backgroundColor: '#0a0e13',
        backgroundImage: 'radial-gradient(ellipse at 50% 45%, rgba(0,230,118,0.04) 0%, transparent 60%), repeating-linear-gradient(45deg, #0a0e13 0px, #0a0e13 38px, #0c1219 38px, #0c1219 40px)',
      }}
    >
      {/* Background rugby ball */}
      <div aria-hidden className="pointer-events-none fixed inset-0 flex items-center justify-end overflow-hidden" style={{ zIndex: 0, opacity: 0.04 }}>
        <svg viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '85vw', maxWidth: '480px', marginRight: '-60px', transform: 'rotate(-15deg)' }}>
          <path d="M 250,6 C 435,6 494,82 494,150 C 494,218 435,294 250,294 C 65,294 6,218 6,150 C 6,82 65,6 250,6 Z" stroke="#00e676" strokeWidth="4" fill="rgba(0,230,118,0.04)" />
          <path d="M 6,150 C 82,170 166,177 250,177 C 334,177 418,170 494,150" stroke="#00e676" strokeWidth="2.5" fill="none" opacity="0.6" />
          <line x1="250" y1="50" x2="250" y2="250" stroke="#00e676" strokeWidth="2" opacity="0.45" />
          <line x1="233" y1="96"  x2="267" y2="96"  stroke="#00e676" strokeWidth="4" />
          <line x1="231" y1="118" x2="269" y2="118" stroke="#00e676" strokeWidth="4" />
          <line x1="231" y1="140" x2="269" y2="140" stroke="#00e676" strokeWidth="4" />
          <line x1="231" y1="162" x2="269" y2="162" stroke="#00e676" strokeWidth="4" />
          <line x1="233" y1="184" x2="267" y2="184" stroke="#00e676" strokeWidth="4" />
        </svg>
      </div>

      {/* Confetti */}
      {gameState === 'done' && gameOverData?.solved && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden>
          {CONFETTI.map((p, i) => (
            <div key={i} style={{ position: 'absolute', left: p.left, top: '-12px', width: p.size, height: p.size, background: p.color, borderRadius: p.round ? '50%' : '2px', animation: `confetti-fall ${p.duration} ease-in ${p.delay} forwards` }} />
          ))}
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3.5 border-b" style={{ background: 'rgba(10,14,19,0.96)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div>
          <Link href="/" className="text-xl font-black tracking-tight text-white hover:text-[#00e676] transition-colors">Set For Six</Link>
        </div>
        {gameState === 'playing' && deviceId && <div className="text-2xl font-mono font-bold tabular-nums animate-timer-glow">{formatTime(elapsedMs)}</div>}
        {gameState === 'done' && gameOverData && <div className="text-sm text-gray-400 font-mono tabular-nums">{formatTime(gameOverData.totalTimeMs)}</div>}
      </header>

      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto">

        {/* Playing state */}
        {gameState === 'playing' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white mb-3">Can you name this NRL player?</h2>

              <div
                className="mb-4 grid grid-cols-3 overflow-hidden rounded-xl text-center"
                style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {[
                  ['6', 'clues'],
                  ['1', 'player'],
                  ['Fastest', 'wins'],
                ].map(([value, label], idx) => (
                  <div
                    key={label}
                    className="px-2 py-2.5"
                    style={{ borderLeft: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <p className="text-sm font-black leading-none" style={{ color: '#00e676' }}>{value}</p>
                    <p className="text-[11px] uppercase tracking-wider text-gray-600 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar — 6 segments */}
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((n) => {
                  const revealed = n <= clueNumber;
                  const isCurrent = n === clueNumber;
                  return (
                    <div
                      key={n}
                      className="flex-1 rounded-full transition-all duration-300"
                      style={{
                        height: '5px',
                        background: revealed
                          ? isCurrent ? '#00e676' : 'rgba(0,230,118,0.35)'
                          : 'rgba(255,255,255,0.07)',
                        boxShadow: isCurrent ? '0 0 8px rgba(0,230,118,0.5)' : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Clue cards */}
            <div className="space-y-3 mb-6">
              {clues.map((clueText, index) => {
                const clueNum = index + 1;
                const wrongGuessForClue = wrongGuesses[index];
                const isNew = index === clues.length - 1 && index > 0;
                const isCurrent = clueNum === clueNumber;

                return (
                  <div
                    key={clueNum}
                    className={`rounded-xl p-4 ${isNew ? 'animate-fade-slide-in' : ''}`}
                    style={{
                      background: isCurrent ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isCurrent ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      borderLeft: `3px solid ${isCurrent ? '#00e676' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Numbered badge */}
                      <div
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mt-0.5"
                        style={{
                          background: isCurrent ? '#00e676' : 'rgba(255,255,255,0.08)',
                          color: isCurrent ? '#0a0e13' : '#6b7280',
                        }}
                      >
                        {clueNum}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-white leading-relaxed">{clueText}</p>
                        {wrongGuessForClue && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                            <span>✕</span>
                            <span>{wrongGuessForClue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Guess input */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Type a player&apos;s name</p>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                  placeholder="Type player name…"
                  autoComplete="off"
                  autoFocus
                  disabled={isGuessing || !deviceId}
                  className="flex-1 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-base focus:outline-none disabled:opacity-50 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button onClick={handleGuess} disabled={isGuessing || !currentGuess.trim() || !deviceId} className="font-semibold px-5 py-3 rounded-xl disabled:opacity-40 active:scale-95 transition-transform text-white" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  {isGuessing ? '…' : 'Lock it in'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Done state */}
        {gameState === 'done' && gameOverData && (
          <div className="space-y-4">

            {/* Result hero card */}
            <div className="rounded-2xl p-5 text-center" style={{ background: '#0f1419', border: `1px solid ${gameOverData.solved ? 'rgba(0,230,118,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
              {/* Icon */}
              <div className="text-4xl mb-3">{gameOverData.solved ? '🏉' : '😤'}</div>

              {/* Player name — the hero */}
              <p className="text-xs font-bold tracking-widest mb-1" style={{ color: gameOverData.solved ? '#00e676' : '#f87171' }}>
                {gameOverData.solved ? 'YOU GOT IT' : 'TODAY\'S PLAYER'}
              </p>
              <h1 className="text-3xl font-black text-white leading-tight mb-3">{gameOverData.answer}</h1>

              {/* Score fraction + dots in one row */}
              <div className="flex items-center justify-center gap-3 mb-1">
                <span className="text-lg font-black tabular-nums" style={{ color: gameOverData.solved ? '#00e676' : '#f87171' }}>
                  {gameOverData.solved ? gameOverData.cluesUsed : '✗'}<span className="text-gray-600 font-normal text-base"> / 6</span>
                </span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((n) => {
                    const isCorrect = gameOverData.solved && n === gameOverData.cluesUsed;
                    const wasRevealed = n <= gameOverData.cluesUsed;
                    return (
                      <div key={n} className="rounded-full" style={{
                        width: 10, height: 10,
                        background: isCorrect ? '#00e676' : wasRevealed ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.08)',
                        border: `1px solid ${isCorrect ? '#00e676' : wasRevealed ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.12)'}`,
                      }} />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* All the clues */}
            {gameOverData.allClues?.length === 6 && (
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs text-gray-500 uppercase tracking-wider">All the clues</p>
                <ul className="space-y-2.5">
                  {gameOverData.allClues.map((clueText, i) => {
                    const clueNum = i + 1;
                    const wasRevealed = clueNum <= gameOverData.cluesUsed;
                    const isSolvedOn = gameOverData.solved && clueNum === gameOverData.cluesUsed;
                    return (
                      <li key={clueNum} className="flex items-start gap-3">
                        <div
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mt-0.5"
                          style={{
                            background: isSolvedOn ? '#00e676' : wasRevealed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                            color: isSolvedOn ? '#0a0e13' : wasRevealed ? 'white' : '#6b7280',
                          }}
                        >
                          {clueNum}
                        </div>
                        <p className={`text-sm leading-relaxed ${wasRevealed ? 'text-white' : 'text-gray-400'}`}>{clueText}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Horizontal stats strip */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Time</p>
                <p className="text-lg font-black font-mono tabular-nums text-white">{formatTime(gameOverData.totalTimeMs)}</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Rank</p>
                <p className="text-lg font-black text-white">{gameOverData.rank !== null ? `#${gameOverData.rank}` : '—'}</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)' }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#00e676' }}>Streak</p>
                <p className="text-lg font-black" style={{ color: '#00e676' }}>{streak}🔥</p>
              </div>
            </div>

            {/* Share — primary CTA */}
            <button onClick={handleShare} className="w-full font-bold py-4 rounded-xl active:scale-95 transition-transform text-base" style={{ background: '#00e676', color: '#000' }}>
              {copied ? '✓ Copied to clipboard!' : 'Share your result'}
            </button>

            {/* Save name — secondary */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your name on the leaderboard</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, 20))}
                  onKeyDown={(e) => e.key === 'Enter' && handleUsernameSave()}
                  placeholder="Anonymous"
                  maxLength={20}
                  className="flex-1 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  onClick={handleUsernameSave}
                  className="px-4 py-2 rounded-lg text-sm font-semibold active:scale-95 transition-all whitespace-nowrap"
                  style={{ background: usernameSaved ? '#00e676' : 'rgba(0,230,118,0.12)', color: usernameSaved ? '#000' : '#00e676', border: '1px solid rgba(0,230,118,0.3)' }}
                >
                  {usernameSaved ? '✓ Saved!' : 'Save'}
                </button>
              </div>
            </div>

            {/* Leaderboard button — prominent, right under name box */}
            <Link
              href="/leaderboard"
              className="block w-full text-center font-bold py-3.5 rounded-xl text-sm active:scale-95 transition-transform"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
            >
              View Leaderboard →
            </Link>

            {/* Facts */}
            {gameOverData.facts?.length > 0 && (
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)', borderLeft: '3px solid #00e676' }}>
                <p className="text-sm font-semibold text-[#00e676]">🧠 Did you know?</p>
                <ul className="space-y-2">
                  {gameOverData.facts.map((fact, i) => (
                    <li key={i} className="text-sm text-gray-300 leading-relaxed">• {fact}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Drama */}
            {gameOverData.drama && (
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.2)', borderLeft: '3px solid #fb923c' }}>
                <p className="text-sm font-semibold" style={{ color: '#fb923c' }}>🔥 Drama</p>
                <p className="text-sm text-gray-300 leading-relaxed">{gameOverData.drama}</p>
              </div>
            )}

            {/* How everyone did */}
            {stats && stats.totalPlayers >= 20 && (
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-gray-300">How everyone did</p>
                  <p className="text-xs text-gray-500">{stats.totalPlayers} {stats.totalPlayers === 1 ? 'player' : 'players'}</p>
                </div>
                {[1, 2, 3, 4, 5, 6, 'failed'].map((key) => {
                  const count = stats.distribution[key] ?? 0;
                  const pct = (count / stats.totalPlayers) * 100;
                  const isYou = gameOverData.solved ? key === gameOverData.cluesUsed : key === 'failed';
                  const label = key === 'failed' ? 'Failed' : `${key} clue${key === 1 ? '' : 's'}`;
                  return (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      <span className="w-14 text-right text-gray-500 shrink-0">{label}</span>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', height: 18 }}>
                        <div style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, height: '100%', borderRadius: '9999px', background: isYou ? '#00e676' : key === 'failed' ? 'rgba(248,113,113,0.45)' : 'rgba(255,255,255,0.2)', transition: 'width 0.6s ease' }} />
                      </div>
                      <span className="w-5 text-right text-gray-500 shrink-0">{count}</span>
                      {isYou ? <span className="text-[#00e676] font-bold shrink-0">YOU</span> : <span className="w-7 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Yesterday's answer */}
            {yesterdayData && (
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Yesterday&apos;s answer</p>
                <p className="text-lg font-bold text-white">{yesterdayData.answer}</p>
                {yesterdayData.facts?.length > 0 && (
                  <ul className="space-y-2 pt-1">
                    {yesterdayData.facts.map((fact, i) => (
                      <li key={i} className="text-sm text-gray-400 leading-relaxed">• {fact}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Bottom section */}
            <div className="pt-2 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Countdown */}
              <div className="text-center py-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Next game in</p>
                <p className="text-3xl font-mono font-black tabular-nums" style={{ color: '#00e676' }}>{countdown}</p>
              </div>

              {/* Email signup — subtle */}
              {emailState === 'done' ? (
                <p className="text-center text-[#00e676] text-sm">You&apos;re in! We&apos;ll remind you tomorrow at 7am Sydney / 9am NZ.</p>
              ) : (
                <div className="rounded-xl p-3" style={{ background: '#121821' }}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm text-white font-medium">Daily reminder at 7am Sydney / 9am NZ</p>
                      <p className="text-xs text-gray-500">Keep your streak alive.</p>
                    </div>
                  </div>
                  <form onSubmit={handleEmailSubmit} className="flex gap-2">
                    <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="your@email.com" disabled={emailState === 'loading'} className="flex-1 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none disabled:opacity-50" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button type="submit" disabled={emailState === 'loading'} className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 whitespace-nowrap" style={{ background: 'rgba(0,230,118,0.12)', color: '#00e676', border: '1px solid rgba(0,230,118,0.2)' }}>
                      {emailState === 'loading' ? '…' : 'Opt in'}
                    </button>
                  </form>
                  {emailState === 'error' && <p className="text-xs text-red-400 mt-2">Something went wrong. Try again.</p>}
                </div>
              )}

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
