'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '../components/Nav';

function formatSeconds(ms) {
  return (ms / 1000).toFixed(1) + 's';
}

function formatClues(n) {
  return n === 1 ? '1 clue' : `${n} clues`;
}

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

const RANK_STYLES = {
  1: { text: 'text-yellow-400', border: 'border-l-2 border-yellow-400', bg: 'bg-[#12100a]' },
  2: { text: 'text-gray-300',   border: 'border-l-2 border-gray-400',   bg: 'bg-[#0e0f10]' },
  3: { text: 'text-amber-500',  border: 'border-l-2 border-amber-600',  bg: 'bg-[#120e08]' },
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [gameNumber, setGameNumber] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const channelRef = useRef(null);

  useEffect(() => {
    setDeviceId(localStorage.getItem('footyiq_device_id'));
  }, []);

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

  useEffect(() => {
    async function init() {
      const id = await fetchLeaderboard();
      setLoading(false);
      if (id) setGameId(id);
    }
    init();
  }, []);

  useEffect(() => {
    if (!gameId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`leaderboard:${gameId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attempts', filter: `game_id=eq.${gameId}` },
        (payload) => { if (payload.new?.solved) fetchLeaderboard(); })
      .subscribe();

    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [gameId]);

  return (
    <div className="bg-texture min-h-screen text-white flex flex-col">

      <Nav />

      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto">

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Today's Leaderboard</h1>
          {gameNumber && (
            <p className="text-sm text-gray-500 mt-1">Game #{gameNumber}</p>
          )}
        </div>

        {loading && <p className="text-gray-500 text-center animate-pulse">Loading…</p>}
        {!loading && error && <p className="text-red-400 text-center">{error}</p>}

        {!loading && !error && entries.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-2">No scores yet</p>
            <p className="text-gray-700 text-sm">Be the first to finish today's game!</p>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            {/* Live indicator */}
            <div className="flex items-center gap-2 mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e676]" />
              </span>
              <span className="text-xs text-gray-500">Live</span>
              <span className="text-xs text-gray-600 ml-auto">
                {entries.length} {entries.length === 1 ? 'player' : 'players'} finished
              </span>
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {entries.map((entry) => {
                const isMe = deviceId && entry.deviceId === deviceId;
                const rankStyle = RANK_STYLES[entry.rank];
                const medal = MEDAL[entry.rank];

                return (
                  <div
                    key={`${entry.deviceId}-${entry.rank}`}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      ${isMe
                        ? 'border border-blue-600 bg-blue-950/50'
                        : rankStyle
                          ? `${rankStyle.bg} ${rankStyle.border}`
                          : 'bg-[#0d1117] border border-transparent'
                      }
                    `}
                    style={!isMe && !rankStyle ? { border: '1px solid rgba(255,255,255,0.05)' } : {}}
                  >
                    {/* Rank column */}
                    <div className="w-10 flex-shrink-0 flex flex-col items-center">
                      {medal ? (
                        <>
                          <span className="text-lg leading-none">{medal}</span>
                          <span className={`text-xs font-bold mt-0.5 ${rankStyle?.text ?? 'text-gray-500'}`}>
                            #{entry.rank}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-gray-600">
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Player */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-300 font-mono">…{entry.deviceSuffix}</span>
                      {isMe && (
                        <span className="ml-2 text-xs text-blue-400 font-medium">you</span>
                      )}
                    </div>

                    {/* Clues */}
                    <div className="text-sm text-gray-500 flex-shrink-0">
                      {formatClues(entry.cluesUsed)}
                    </div>

                    {/* Time */}
                    <div className={`text-sm font-mono font-semibold flex-shrink-0 ${rankStyle?.text ?? 'text-gray-400'}`}>
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
