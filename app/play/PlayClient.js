'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';

const CONFETTI_COLOURS = ['#00e676', '#ffb800', '#ff4466', '#4499ff', '#cc44ff', '#ffffff'];
const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  color: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
  left: `${((i * 41 + 7) % 96) + 2}%`,
  duration: `${1.6 + (i % 9) * 0.22}s`,
  delay: `${(i % 11) * 0.06}s`,
  size: `${7 + (i % 5)}px`,
  round: i % 3 !== 0,
}));

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
    ? [...Array(cluesUsed - 1).fill('🟥'), '🟩', ...Array(6 - cluesUsed).fill('⬜')]
    : Array(6).fill('🟥');
  const clueWord = cluesUsed === 1 ? 'clue' : 'clues';
  const lines = [`Set For Six #${gameNumber} 🏉`, squares.join(''), ''];
  if (solved) {
    lines.push(`🎯 Cracked it in ${cluesUsed} ${clueWord} · ${formatTime(totalTimeMs)}`);
    if (rank !== null && rank !== undefined && totalPlayers) lines.push(`📊 Ranked #${rank} of ${totalPlayers} players`);
    lines.push(`🔥 ${streak} day streak`);
  } else {
    lines.push(`🎯 Didn't crack it · ${formatTime(totalTimeMs)}`);
    if (totalPlayers) lines.push(`📊 ${totalPlayers} players attempted`);
  }
  lines.push('');
  lines.push('Think you know league? setforsix.com');
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
      const r = localStorage.getItem(`setforsix_result_${k}`) || localStorage.getItem(`footyiq_result_${k}`);
      if (r) { try { if (JSON.parse(r).solved) { s++; } else break; } catch { break; } }
      else break;
    }
    return s;
  }, [gameOverData, game]);

  // ── Device ID + username ───────────────────────────────────────────────────

  useEffect(() => {
    let id = localStorage.getItem('setforsix_device_id') || localStorage.getItem('footyiq_device_id');
    if (!id) id = generateUUID();
    localStorage.setItem('setforsix_device_id', id);
    setDeviceId(id);
    const savedUsername = localStorage.getItem('setforsix_username');
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
      localStorage.getItem(`setforsix_result_${initialGame.date}`) ||
      localStorage.getItem(`footyiq_result_${initialGame.date}`);
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
    async ({ solved, answer, cluesUsed, totalTimeMs, allGuesses, facts = [] }) => {
      try {
        const currentUsername = localStorage.getItem('setforsix_username') || 'Anonymous';
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: game.id, deviceId, cluesUsed, totalTimeMs, guesses: allGuesses, solved, username: currentUsername }),
        });
        const submitData = await res.json();
        const rank = res.ok && submitData.success ? submitData.rank : null;
        const totalPlayers = res.ok && submitData.success ? submitData.totalPlayers : null;
        const percentile = res.ok && submitData.success ? submitData.percentile : null;
        const resultData = { solved, answer, cluesUsed, totalTimeMs, rank, totalPlayers, percentile, facts };
        setGameOverData(resultData);
        setGameState('done');
        localStorage.setItem(`setforsix_result_${game.date}`, JSON.stringify(resultData));
      } catch {
        const resultData = { solved, answer, cluesUsed, totalTimeMs, rank: null, totalPlayers: null, percentile: null, facts };
        setGameOverData(resultData);
        setGameState('done');
        localStorage.setItem(`setforsix_result_${game.date}`, JSON.stringify(resultData));
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
        await finishGame({ solved: true, answer: data.answer, cluesUsed: clueNumber, totalTimeMs: Math.round(performance.now() - startTimeRef.current), allGuesses: [...wrongGuesses, guessText], facts: data.facts || [] });
      } else if (data.failed) {
        clearInterval(timerRef.current);
        const allGuesses = [...wrongGuesses, guessText];
        setWrongGuesses(allGuesses);
        await finishGame({ solved: false, answer: data.answer, cluesUsed: 6, totalTimeMs: Math.round(performance.now() - startTimeRef.current), allGuesses, facts: data.facts || [] });
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
      setEmailState(res.ok ? 'done' : 'error');
    } catch { setEmailState('error'); }
  }

  // ── Save username ──────────────────────────────────────────────────────────

  async function handleUsernameSave() {
    const trimmed = username.trim() || 'Anonymous';
    setUsername(trimmed);
    localStorage.setItem('setforsix_username', trimmed);
    if (game?.id && deviceId) {
      try {
        const res = await fetch('/api/attempt/update-username', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, gameId: game.id, username: trimmed }),
        });
        const result = await res.json();
        console.log('[username save] response:', result);
      } catch (e) {
        console.error('[username save] fetch error:', e);
      }
    }
    setUsernameSaved(true);
    setTimeout(() => setUsernameSaved(false), 2000);
  }

  // ── Copy share text ────────────────────────────────────────────────────────

  function handleCopy() {
    if (!game || !gameOverData) return;
    navigator.clipboard.writeText(
      buildShareText(game.game_number, gameOverData.solved, gameOverData.cluesUsed, gameOverData.totalTimeMs, gameOverData.rank, gameOverData.totalPlayers, streak)
    ).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
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
          {game && <p className="text-xs text-gray-500 mt-0.5">Game #{game.game_number}</p>}
        </div>
        {gameState === 'playing' && <div className="text-2xl font-mono font-bold tabular-nums animate-timer-glow">{formatTime(elapsedMs)}</div>}
        {gameState === 'done' && gameOverData && <div className="text-sm text-gray-400 font-mono tabular-nums">{formatTime(gameOverData.totalTimeMs)}</div>}
      </header>

      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto">

        {/* Playing state */}
        {gameState === 'playing' && (
          <>
            <div className="rounded-2xl p-5 space-y-5 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {clues.map((clueText, index) => {
                const clueNum = index + 1;
                const wrongGuessForClue = wrongGuesses[index];
                const isNew = index === clues.length - 1 && index > 0;
                return (
                  <div key={clueNum} className={isNew ? 'animate-fade-slide-in' : ''}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Clue {clueNum}</span>
                      {wrongGuessForClue && <span className="text-sm text-red-400 font-medium truncate">— {wrongGuessForClue}</span>}
                    </div>
                    <p className="text-base text-gray-100 leading-relaxed">{clueText}</p>
                  </div>
                );
              })}
            </div>
            <div>
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
                  {isGuessing ? '…' : 'Guess'}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">Clue {clueNumber} of 6</p>
            </div>
          </>
        )}

        {/* Done state */}
        {gameState === 'done' && gameOverData && (
          <div className="space-y-5">

            <div className="text-center pt-2">
              <p className="text-sm text-gray-500 mb-2">The answer was</p>
              <p className={`text-3xl font-bold ${gameOverData.solved ? 'text-[#00e676]' : 'text-red-400'}`}>{gameOverData.answer}</p>
              <p className="text-sm text-gray-500 mt-2">
                {gameOverData.solved ? `Solved in ${gameOverData.cluesUsed} ${gameOverData.cluesUsed === 1 ? 'clue' : 'clues'}` : 'Better luck tomorrow'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: gameOverData.cluesUsed, label: 'Clues used' },
                { value: formatTime(gameOverData.totalTimeMs), label: 'Time', mono: true },
                ...(gameOverData.rank !== null ? [
                  { value: `#${gameOverData.rank}`, label: `Rank of ${gameOverData.totalPlayers}` },
                  { value: `${gameOverData.percentile}%`, label: 'Percentile' },
                ] : []),
              ].map(({ value, label, mono }) => (
                <div key={label} className="rounded-xl py-4 px-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className={`text-2xl font-bold ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your display name</p>
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
              <p className="text-xs text-gray-600 mt-1.5">Your name on the leaderboard</p>
            </div>

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

            {stats && stats.totalPlayers > 0 && (
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

            <div className="rounded-xl p-4" style={{ background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.15)', borderLeft: '3px solid #00e676' }}>
              <p className="font-mono text-sm text-gray-200 whitespace-pre-line leading-relaxed">
                {buildShareText(game.game_number, gameOverData.solved, gameOverData.cluesUsed, gameOverData.totalTimeMs, gameOverData.rank, gameOverData.totalPlayers, streak)}
              </p>
            </div>

            <button onClick={handleCopy} className="w-full font-bold py-3.5 rounded-xl active:scale-95 transition-transform text-base" style={{ background: '#00e676', color: '#000' }}>
              {copied ? '✓ Copied!' : '📋 Copy & Share Result'}
            </button>

            <div className="rounded-xl p-5" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              {emailState === 'done' ? (
                <p className="text-center text-[#00e676] text-sm">You&apos;re in! We&apos;ll remind you tomorrow at 7am.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 text-center">Get tomorrow&apos;s game at 7am</p>
                  <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-2">
                    <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="your@email.com" className="flex-1 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button type="submit" disabled={emailState === 'loading'} className="text-white text-sm font-medium px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors whitespace-nowrap" style={{ background: '#1a2535', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {emailState === 'loading' ? '…' : 'Notify me'}
                    </button>
                  </form>
                  {emailState === 'error' && <p className="text-xs text-red-400 text-center">Something went wrong. Try again.</p>}
                </div>
              )}
            </div>

            <div className="text-center py-2 space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Next game in</p>
              <p className="text-3xl font-mono font-bold tabular-nums" style={{ color: '#00e676' }}>{countdown}</p>
              <p className="text-xs text-gray-600">Don&apos;t break your streak</p>
            </div>

            <Link href="/leaderboard" className="block text-center text-sm text-gray-500 hover:text-gray-300 transition-colors pb-4">
              View leaderboard →
            </Link>

          </div>
        )}

      </main>
    </div>
  );
}
