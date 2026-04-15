'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;
}

function buildShareText(gameNumber, solved, cluesUsed, totalTimeMs) {
  const squares = solved
    ? [
        ...Array(cluesUsed - 1).fill('🟥'),
        '🟩',
        ...Array(6 - cluesUsed).fill('⬜'),
      ]
    : Array(6).fill('🟥');
  const clueWord = cluesUsed === 1 ? 'clue' : 'clues';
  return `FootyIQ #${gameNumber}\n${squares.join('')}\n${cluesUsed} ${clueWord} · ${formatTime(totalTimeMs)}\nfootyiq.au`;
}

export default function PlayPage() {
  const [deviceId, setDeviceId] = useState(null);
  const [gameState, setGameState] = useState('loading'); // loading | error | playing | done
  const [game, setGame] = useState(null);
  const [clues, setClues] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [clueNumber, setClueNumber] = useState(1);
  const [gameOverData, setGameOverData] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [emailInput, setEmailInput] = useState('');
  const [emailState, setEmailState] = useState('idle'); // idle | loading | done | error
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isGuessing, setIsGuessing] = useState(false);

  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  // ── Initialise device ID ───────────────────────────────────────────────────

  useEffect(() => {
    let id = localStorage.getItem('footyiq_device_id');
    if (!id) {
      id = generateUUID();
      localStorage.setItem('footyiq_device_id', id);
    }
    setDeviceId(id);
  }, []);

  // ── Load today's game ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!deviceId) return;

    async function loadGame() {
      try {
        const res = await fetch('/api/game/today');

        if (res.status === 404) {
          setLoadError('No game today. Check back tomorrow!');
          setGameState('error');
          return;
        }
        if (!res.ok) {
          setLoadError('Failed to load the game. Please refresh.');
          setGameState('error');
          return;
        }

        const data = await res.json();

        // Already played today?
        const saved = localStorage.getItem(`footyiq_result_${data.date}`);
        if (saved) {
          setGame(data);
          setGameOverData(JSON.parse(saved));
          setGameState('done');
          return;
        }

        setGame(data);
        setClues([data.clue_1]);
        startTimeRef.current = performance.now();
        setGameState('playing');
      } catch {
        setLoadError('Something went wrong. Please refresh.');
        setGameState('error');
      }
    }

    loadGame();
  }, [deviceId]);

  // ── Timer ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setElapsedMs(performance.now() - startTimeRef.current);
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [gameState]);

  // ── Autofocus input when a new clue is revealed ────────────────────────────

  useEffect(() => {
    if (gameState === 'playing') {
      inputRef.current?.focus();
    }
  }, [gameState, clueNumber]);

  // ── Submit final result to /api/submit ─────────────────────────────────────

  const finishGame = useCallback(
    async ({ solved, answer, cluesUsed, totalTimeMs, allGuesses }) => {
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: game.id,
            deviceId,
            cluesUsed,
            totalTimeMs,
            guesses: allGuesses,
            solved,
          }),
        });

        const submitData = await res.json();
        const rank = res.ok && submitData.success ? submitData.rank : null;
        const totalPlayers = res.ok && submitData.success ? submitData.totalPlayers : null;
        const percentile = res.ok && submitData.success ? submitData.percentile : null;

        const resultData = { solved, answer, cluesUsed, totalTimeMs, rank, totalPlayers, percentile };
        setGameOverData(resultData);
        setGameState('done');
        localStorage.setItem(`footyiq_result_${game.date}`, JSON.stringify(resultData));
      } catch {
        // Show result even if submit fails
        const resultData = { solved, answer, cluesUsed, totalTimeMs, rank: null, totalPlayers: null, percentile: null };
        setGameOverData(resultData);
        setGameState('done');
      } finally {
        setIsGuessing(false);
      }
    },
    [game, deviceId]
  );

  // ── Handle a guess submission ──────────────────────────────────────────────

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
        body: JSON.stringify({
          gameId: game.id,
          deviceId,
          guess: guessText,
          clueNumber,
          totalTimeMs: timeMs,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCurrentGuess(guessText); // restore on error
        setIsGuessing(false);
        return;
      }

      if (data.correct) {
        const finalMs = Math.round(performance.now() - startTimeRef.current);
        clearInterval(timerRef.current);
        await finishGame({
          solved: true,
          answer: data.answer,
          cluesUsed: clueNumber,
          totalTimeMs: finalMs,
          allGuesses: [...wrongGuesses, guessText],
        });
      } else if (data.failed) {
        const finalMs = Math.round(performance.now() - startTimeRef.current);
        clearInterval(timerRef.current);
        const allGuesses = [...wrongGuesses, guessText];
        setWrongGuesses(allGuesses);
        await finishGame({
          solved: false,
          answer: data.answer,
          cluesUsed: 6,
          totalTimeMs: finalMs,
          allGuesses,
        });
      } else {
        // Wrong — reveal next clue
        setWrongGuesses((prev) => [...prev, guessText]);
        setClues((prev) => [...prev, data.nextClue]);
        setClueNumber((prev) => prev + 1);
        setIsGuessing(false);
      }
    } catch {
      setCurrentGuess(guessText); // restore on network error
      setIsGuessing(false);
    }
  }, [currentGuess, isGuessing, game, deviceId, clueNumber, wrongGuesses, finishGame]);

  // ── Email signup ───────────────────────────────────────────────────────────

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setEmailState('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      setEmailState(res.ok ? 'done' : 'error');
    } catch {
      setEmailState('error');
    }
  }

  // ── Copy share text ────────────────────────────────────────────────────────

  function handleCopy() {
    if (!game || !gameOverData) return;
    const shareText = buildShareText(
      game.game_number,
      gameOverData.solved,
      gameOverData.cluesUsed,
      gameOverData.totalTimeMs
    );
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (gameState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-lg animate-pulse">Loading today's game…</p>
      </div>
    );
  }

  if (gameState === 'error') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <p className="text-red-400 text-center text-lg">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight">FootyIQ</h1>
          {game && (
            <p className="text-xs text-gray-500 mt-0.5">Game #{game.game_number}</p>
          )}
        </div>
        {gameState === 'playing' && (
          <div className="text-2xl font-mono font-semibold tabular-nums">
            {formatTime(elapsedMs)}
          </div>
        )}
        {gameState === 'done' && gameOverData && (
          <div className="text-sm text-gray-400 font-mono tabular-nums">
            {formatTime(gameOverData.totalTimeMs)}
          </div>
        )}
      </header>

      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto">

        {/* ── Playing state ─────────────────────────────────────────────── */}
        {gameState === 'playing' && (
          <>
            {/* Clue list */}
            <div className="space-y-5">
              {clues.map((clueText, index) => {
                const clueNum = index + 1;
                const wrongGuessForClue = wrongGuesses[index];

                return (
                  <div key={clueNum}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Clue {clueNum}
                      </span>
                      {wrongGuessForClue && (
                        <span className="text-sm text-red-400 font-medium truncate">
                          — {wrongGuessForClue}
                        </span>
                      )}
                    </div>
                    <p className="text-base text-gray-100 leading-relaxed">{clueText}</p>
                  </div>
                );
              })}
            </div>

            {/* Guess input */}
            <div className="mt-8">
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
                  disabled={isGuessing}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-base focus:outline-none focus:border-gray-600 disabled:opacity-50 transition-colors"
                />
                <button
                  onClick={handleGuess}
                  disabled={isGuessing || !currentGuess.trim()}
                  className="bg-white text-gray-950 font-semibold px-5 py-3 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
                >
                  {isGuessing ? '…' : 'Guess'}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Clue {clueNumber} of 6
              </p>
            </div>
          </>
        )}

        {/* ── Done state (just finished or already played) ───────────────── */}
        {gameState === 'done' && gameOverData && (
          <div className="space-y-6">

            {/* Answer */}
            <div className="text-center pt-2">
              <p className="text-sm text-gray-500 mb-2">The answer was</p>
              <p
                className={`text-3xl font-bold ${
                  gameOverData.solved ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {gameOverData.answer}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {gameOverData.solved
                  ? `Solved in ${gameOverData.cluesUsed} ${gameOverData.cluesUsed === 1 ? 'clue' : 'clues'}`
                  : 'Better luck tomorrow'}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-xl py-4 px-3 text-center">
                <p className="text-2xl font-bold">{gameOverData.cluesUsed}</p>
                <p className="text-xs text-gray-500 mt-1">Clues used</p>
              </div>
              <div className="bg-gray-800 rounded-xl py-4 px-3 text-center">
                <p className="text-2xl font-bold font-mono tabular-nums">
                  {formatTime(gameOverData.totalTimeMs)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Time</p>
              </div>
              {gameOverData.rank !== null && (
                <>
                  <div className="bg-gray-800 rounded-xl py-4 px-3 text-center">
                    <p className="text-2xl font-bold">#{gameOverData.rank}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Rank of {gameOverData.totalPlayers}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-xl py-4 px-3 text-center">
                    <p className="text-2xl font-bold">{gameOverData.percentile}%</p>
                    <p className="text-xs text-gray-500 mt-1">Percentile</p>
                  </div>
                </>
              )}
            </div>

            {/* Share card preview */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="font-mono text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                {buildShareText(
                  game.game_number,
                  gameOverData.solved,
                  gameOverData.cluesUsed,
                  gameOverData.totalTimeMs
                )}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="w-full bg-white text-gray-950 font-semibold py-3 rounded-xl active:scale-95 transition-transform"
            >
              {copied ? 'Copied!' : 'Copy Result'}
            </button>

            {/* Email signup */}
            <div className="border-t border-gray-800 pt-6">
              {emailState === 'done' ? (
                <p className="text-center text-green-400 text-sm">
                  You're in! We'll remind you tomorrow at 7am.
                </p>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <p className="text-sm text-gray-400 text-center">
                    Get tomorrow's game at 7am
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-600 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={emailState === 'loading'}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
                    >
                      {emailState === 'loading' ? '…' : 'Notify me'}
                    </button>
                  </div>
                  {emailState === 'error' && (
                    <p className="text-xs text-red-400 text-center">
                      Something went wrong. Try again.
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Leaderboard link */}
            <Link
              href="/leaderboard"
              className="block text-center text-sm text-gray-500 hover:text-gray-300 transition-colors pb-6"
            >
              View leaderboard →
            </Link>

          </div>
        )}

      </main>
    </div>
  );
}
