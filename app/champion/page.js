'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Nav from '../components/Nav';

function formatSeconds(ms) {
  return (ms / 1000).toFixed(1) + 's';
}

function formatClues(n) {
  return n === 1 ? '1 clue' : `${n} clues`;
}

function formatDisplayDate(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function isToday(dateStr) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  return dateStr === today;
}

export default function ChampionPage() {
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const todayAEST = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });

  useEffect(() => {
    async function loadChampions() {
      try {
        const res = await fetch('/api/champion/history?days=7');
        if (!res.ok) { setError('Failed to load champion history'); return; }
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
    <div className="bg-texture min-h-screen text-white flex flex-col">

      <Nav />

      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto space-y-8">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-black text-white">Daily Champions</h1>
          <p className="text-sm text-gray-500 mt-1">The fastest players to crack it</p>
        </div>

        {/* ── Today's champion card ────────────────────────────────────── */}
        <section>
          <p className="text-xs font-bold tracking-[0.25em] text-gray-500 uppercase mb-3">
            Today's Champion
          </p>
          {imageError ? (
            <div
              className="rounded-xl flex items-center justify-center h-40 text-gray-600 text-sm"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              Card unavailable
            </div>
          ) : (
            <img
              src={`/api/champion?date=${todayAEST}`}
              alt="Today's FootyIQ champion"
              onError={() => setImageError(true)}
              className="w-full rounded-xl"
              style={{ aspectRatio: '1200 / 630', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          )}
        </section>

        {/* ── Hall of fame ─────────────────────────────────────────────── */}
        <section>
          <p className="text-xs font-bold tracking-[0.25em] text-gray-500 uppercase mb-3">
            Hall of Fame
          </p>

          {loading && <p className="text-gray-600 text-sm animate-pulse">Loading…</p>}
          {!loading && error && <p className="text-red-400 text-sm">{error}</p>}
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
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: today ? 'rgba(0,230,118,0.05)' : 'rgba(255,255,255,0.03)',
                      border: today ? '1px solid rgba(0,230,118,0.2)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex-shrink-0 w-8 text-center">
                      {today
                        ? <span className="text-lg">🏆</span>
                        : <span className="text-gray-600 text-sm font-mono">#{gameNumber}</span>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${today ? 'text-white' : 'text-gray-400'}`}>
                        {today ? 'Today' : formatDisplayDate(date)}
                      </p>
                      {!today && (
                        <p className="text-xs text-gray-600">Game #{gameNumber}</p>
                      )}
                    </div>

                    {champion ? (
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-mono font-semibold ${today ? 'text-[#00e676]' : 'text-white'}`}>
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

        {/* ── Links ───────────────────────────────────────────────────── */}
        <section className="flex gap-3 pb-6">
          <Link
            href="/play"
            className="flex-1 text-center font-bold py-3 rounded-xl text-sm text-black active:scale-95 transition-transform"
            style={{ background: '#00e676' }}
          >
            Play today
          </Link>
          <Link
            href="/leaderboard"
            className="flex-1 text-center font-medium py-3 rounded-xl text-sm text-white active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Leaderboard
          </Link>
        </section>

      </main>
    </div>
  );
}
