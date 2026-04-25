'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Nav from '../components/Nav';

function formatSeconds(ms) { return (ms / 1000).toFixed(1) + 's'; }
function formatClues(n) { return n === 1 ? '1 clue' : `${n} clues`; }


const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_STYLES = {
  1: { text: 'text-yellow-400', border: 'border-l-2 border-yellow-400', bg: 'bg-[#12100a]' },
  2: { text: 'text-gray-300',   border: 'border-l-2 border-gray-400',   bg: 'bg-[#0e0f10]' },
  3: { text: 'text-amber-500',  border: 'border-l-2 border-amber-600',  bg: 'bg-[#120e08]' },
};

export default function LeaderboardClient({ initialData }) {
  const [entries, setEntries] = useState(initialData.entries);
  const [gameNumber, setGameNumber] = useState(initialData.gameNumber);
  const [gameId, setGameId] = useState(initialData.gameId);
  const [deviceId] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('setforsix_device_id') || localStorage.getItem('footyiq_device_id');
  });
  const [error, setError] = useState(null);

  const channelRef = useRef(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to load leaderboard'); return; }
      const data = await res.json();
      setEntries(data.entries);
      setGameNumber(data.gameNumber);
      if (data.gameId && data.gameId !== gameId) setGameId(data.gameId);
      setError(null);
    } catch {
      setError('Failed to load leaderboard');
    }
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`leaderboard:${gameId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attempts', filter: `game_id=eq.${gameId}` },
        (payload) => { if (payload.new?.solved) fetchLeaderboard(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attempts', filter: `game_id=eq.${gameId}` },
        () => { fetchLeaderboard(); })
      .subscribe();

    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [gameId, fetchLeaderboard]);

  return (
    <div className="bg-texture min-h-screen text-white flex flex-col">
      <Nav />
      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Today&apos;s Leaderboard</h1>
          {gameNumber && <p className="text-sm text-gray-500 mt-1">Game #{gameNumber}</p>}
          <p className="text-xs text-gray-600 mt-2">Ranked by fewest clues, then fastest time.</p>
        </div>

        {error && <p className="text-red-400 text-center">{error}</p>}

        {!error && entries.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-2">No one&apos;s on the board yet</p>
            <p className="text-gray-700 text-sm">Be first to crack today&apos;s player.</p>
            <Link
              href="/play"
              className="mt-6 inline-block rounded-xl px-6 py-3 text-sm font-bold text-black active:scale-95 transition-transform"
              style={{ background: '#00e676' }}
            >
              Play today&apos;s game
            </Link>
          </div>
        )}

        {!error && entries.length > 0 && (
          <>
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

            <div className="space-y-2">
              {entries.map((entry) => {
                const isMe = deviceId && entry.deviceSuffix === deviceId.slice(-4);
                const rankStyle = RANK_STYLES[entry.rank];
                const medal = MEDAL[entry.rank];

                return (
                  <div
                    key={`${entry.deviceSuffix}-${entry.rank}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                      isMe
                        ? 'border border-blue-600 bg-blue-950/50'
                        : rankStyle
                          ? `${rankStyle.bg} ${rankStyle.border}`
                          : 'bg-[#0d1117] border border-transparent'
                    }`}
                    style={!isMe && !rankStyle ? { border: '1px solid rgba(255,255,255,0.05)' } : {}}
                  >
                    <div className="w-10 flex-shrink-0 flex flex-col items-center">
                      {medal ? (
                        <>
                          <span className="text-lg leading-none">{medal}</span>
                          <span className={`text-xs font-bold mt-0.5 ${rankStyle?.text ?? 'text-gray-500'}`}>#{entry.rank}</span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-gray-600">#{entry.rank}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-300 font-medium truncate">{entry.displayName}</span>
                      {isMe && <span className="ml-2 text-xs text-blue-400 font-medium">you</span>}
                    </div>
                    <div className="text-sm text-gray-500 flex-shrink-0">{formatClues(entry.cluesUsed)}</div>
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
