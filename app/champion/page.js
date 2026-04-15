'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function formatSeconds(ms) {
  return (ms / 1000).toFixed(1) + 's';
}

function formatClues(n) {
  return n === 1 ? '1 clue' : `${n} clues`;
}

function formatDisplayDate(dateStr) {
  // dateStr is YYYY-MM-DD. Add noon UTC so timezone shifts don't move the day.
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isToday(dateStr) {
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Australia/Sydney',
  });
  return dateStr === today;
}

export default function ChampionPage() {
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const todayAEST = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Australia/Sydney',
  });

  useEffect(() => {
    async function loadChampions() {
      try {
        const res = await fetch('/api/champion/history?days=7');
        if (!res.ok) {
          setError('Failed to load champion history');
          return;
        }
        const data = await res.json();
        setChampions(data.champions ?? []);
      } catch {
        setError('Failed to load champion history');
      } finally {
        setLoading(false);
      }
    }
    loadChampions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="px-4 py-4 border-b border-gray-800">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">FootyIQ</h1>
            <p className="text-xs text-gray-500 mt-0.5">Daily Champions</p>
          </div>
          <Link
            href="/play"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Play
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto space-y-8">

        {/* ── Today's champion card (OG image) ──────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Today's Champion
          </h2>
          {imageError ? (
            <div className="rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center h-40 text-gray-600 text-sm">
              Card unavailable
            </div>
          ) : (
            <img
              src={`/api/champion?date=${todayAEST}`}
              alt="Today's FootyIQ champion"
              onError={() => setImageError(true)}
              className="w-full rounded-xl border border-gray-800"
              style={{ aspectRatio: '1200 / 630' }}
            />
          )}
        </section>

        {/* ── Last 7 days ───────────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Hall of Fame
          </h2>

          {loading && (
            <p className="text-gray-600 text-sm animate-pulse">Loading…</p>
          )}

          {!loading && error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {!loading && !error && champions.length === 0 && (
            <p className="text-gray-600 text-sm">No games played yet.</p>
          )}

          {!loading && !error && champions.length > 0 && (
            <div className="space-y-2">
              {champions.map(({ date, gameNumber, champion }) => {
                const today = isToday(date);

                return (
                  <div
                    key={date}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      ${today ? 'bg-gray-800 border border-gray-700' : 'bg-gray-900'}
                    `}
                  >
                    {/* Trophy / date label */}
                    <div className="flex-shrink-0 w-8 text-center">
                      {today ? (
                        <span className="text-lg">🏆</span>
                      ) : (
                        <span className="text-gray-600 text-sm">#{gameNumber}</span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${today ? 'text-white' : 'text-gray-400'}`}>
                        {today ? 'Today' : formatDisplayDate(date)}
                      </p>
                      {!today && (
                        <p className="text-xs text-gray-600">Game #{gameNumber}</p>
                      )}
                    </div>

                    {/* Champion info */}
                    {champion ? (
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-mono text-white">
                          …{champion.deviceSuffix}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatClues(champion.cluesUsed)} · {formatSeconds(champion.totalTimeMs)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 flex-shrink-0">No scores yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Links ─────────────────────────────────────────────────────── */}
        <section className="flex gap-4 pb-6">
          <Link
            href="/play"
            className="flex-1 text-center bg-white text-gray-950 font-semibold py-3 rounded-xl text-sm active:scale-95 transition-transform"
          >
            Play today
          </Link>
          <Link
            href="/leaderboard"
            className="flex-1 text-center bg-gray-800 text-white font-medium py-3 rounded-xl text-sm active:scale-95 transition-transform"
          >
            Leaderboard
          </Link>
        </section>

      </main>
    </div>
  );
}
