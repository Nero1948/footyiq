'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function formatSeconds(ms) {
  return (ms / 1000).toFixed(1) + 's';
}

function formatClues(n) {
  return n === 1 ? '1 clue' : `${n} clues`;
}

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

const RANK_COLOURS = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-amber-500',
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [gameNumber, setGameNumber] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveCount, setLiveCount] = useState(0); // pulses when updated in real-time

  const channelRef = useRef(null);

  // ── Read device ID from localStorage ──────────────────────────────────────

  useEffect(() => {
    setDeviceId(localStorage.getItem('footyiq_device_id'));
  }, []);

  // ── Fetch leaderboard ──────────────────────────────────────────────────────

  async function fetchLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to load leaderboard');
        return null;
      }
      const data = await res.json();
      setEntries(data.entries);
      setGameNumber(data.gameNumber);
      setError(null);
      return data.gameId;
    } catch {
      setError('Failed to load leaderboard');
      return null;
    }
  }

  // ── Initial load ───────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const id = await fetchLeaderboard();
      setLoading(false);
      if (id) setGameId(id);
    }
    init();
  }, []);

  // ── Real-time subscription ─────────────────────────────────────────────────

  useEffect(() => {
    if (!gameId) return;

    // Clean up any previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`leaderboard:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attempts',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.new?.solved) {
            fetchLeaderboard();
            setLiveCount((n) => n + 1);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="px-4 py-4 border-b border-gray-800">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">FootyIQ</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {gameNumber ? `Game #${gameNumber} · ` : ''}Today's Leaderboard
            </p>
          </div>
          <Link
            href="/play"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Play
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto">

        {loading && (
          <p className="text-gray-500 text-center animate-pulse">Loading…</p>
        )}

        {!loading && error && (
          <p className="text-red-400 text-center">{error}</p>
        )}

        {!loading && !error && entries.length === 0 && (
          <p className="text-gray-500 text-center py-12">
            No scores yet — be the first to finish!
          </p>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            {/* Live indicator */}
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs text-gray-500">Live</span>
              <span className="text-xs text-gray-600 ml-auto">
                {entries.length} player{entries.length !== 1 ? 's' : ''} finished
              </span>
            </div>

            {/* Leaderboard rows */}
            <div className="space-y-2">
              {entries.map((entry) => {
                const isMe = deviceId && entry.deviceId === deviceId;
                const medalEmoji = MEDAL[entry.rank];
                const rankColour = RANK_COLOURS[entry.rank] ?? 'text-gray-500';

                return (
                  <div
                    key={`${entry.deviceId}-${entry.rank}`}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      ${isMe
                        ? 'bg-blue-950 border border-blue-700'
                        : entry.rank <= 3
                          ? 'bg-gray-800'
                          : 'bg-gray-900'
                      }
                    `}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center flex-shrink-0">
                      {medalEmoji ? (
                        <span className="text-lg">{medalEmoji}</span>
                      ) : (
                        <span className={`text-sm font-semibold ${rankColour}`}>
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Player */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-300 font-mono">
                        …{entry.deviceSuffix}
                      </span>
                      {isMe && (
                        <span className="ml-2 text-xs text-blue-400 font-medium">
                          you
                        </span>
                      )}
                    </div>

                    {/* Clues */}
                    <div className="text-sm text-gray-400 flex-shrink-0">
                      {formatClues(entry.cluesUsed)}
                    </div>

                    {/* Time */}
                    <div className={`text-sm font-mono font-semibold flex-shrink-0 ${rankColour}`}>
                      {formatSeconds(entry.totalTimeMs)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </main>
    </div>
  );
}
