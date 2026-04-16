import Link from 'next/link';
import Nav from '../components/Nav';
import ChampionImage from './ChampionImage';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Set For Six — Champions',
  description: 'Meet the fastest NRL guessers. Who cracked it first today?',
  openGraph: {
    title: 'Set For Six — Champions',
    description: 'Meet the fastest NRL guessers. Who cracked it first today?',
    url: 'https://www.setforsix.com/champion',
    images: [{ url: 'https://www.setforsix.com/api/og', width: 1200, height: 630, alt: 'Set For Six Champions' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Set For Six — Champions',
    description: 'Meet the fastest NRL guessers. Who cracked it first today?',
    images: ['https://www.setforsix.com/api/og'],
  },
};

function formatSeconds(ms) { return (ms / 1000).toFixed(1) + 's'; }
function formatClues(n) { return n === 1 ? '1 clue' : `${n} clues`; }
function formatDisplayDate(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

const FALLBACK_NAMES = ['Mystery Fan', 'Secret Selector', 'Phantom Tipper', 'Ghost Player', 'Undercover Footy Brain', 'Anonymous Legend'];

function getFallbackName(deviceId) {
  let h = 0;
  for (let i = 0; i < deviceId.length; i++) h = (h * 31 + deviceId.charCodeAt(i)) & 0x7fffffff;
  return FALLBACK_NAMES[h % FALLBACK_NAMES.length];
}

function getDisplayName(username, deviceId) {
  if (username && username !== 'Anonymous') return username;
  return getFallbackName(deviceId);
}

function getTitleForClues(cluesUsed) {
  if (cluesUsed === 1) return 'Clue Assassin 🔪';
  if (cluesUsed === 2) return 'Group Chat Menace 😤';
  if (cluesUsed === 3) return 'Knows Their Stuff 🧠';
  if (cluesUsed === 4) return 'Had a Crack 💪';
  if (cluesUsed === 5) return 'Scraped Through 😅';
  if (cluesUsed === 6) return 'Won Ugly 🤕';
  return 'Showed Up ❤️';
}

async function getTodayChampion() {
  const todayAEST = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  try {
    const { data: game } = await supabase
      .from('games').select('id, game_number').eq('date', todayAEST).single();

    if (!game) return { todayAEST, gameNumber: null, champion: null, totalAttempts: 0 };

    const [{ data: attempts }, { count: totalAttempts }] = await Promise.all([
      supabase
        .from('attempts')
        .select('device_id, username, clues_used, total_time_ms')
        .eq('game_id', game.id)
        .eq('solved', true)
        .order('clues_used', { ascending: true })
        .order('total_time_ms', { ascending: true })
        .limit(1),
      supabase
        .from('attempts')
        .select('id', { count: 'exact', head: true })
        .eq('game_id', game.id),
    ]);

    const top = attempts?.[0] ?? null;
    return {
      todayAEST,
      gameNumber: game.game_number,
      totalAttempts: totalAttempts ?? 0,
      champion: top ? {
        name: getDisplayName(top.username, top.device_id),
        cluesUsed: top.clues_used,
        totalTimeMs: top.total_time_ms,
      } : null,
    };
  } catch {
    const todayAEST = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    return { todayAEST, gameNumber: null, champion: null, totalAttempts: 0 };
  }
}

async function getHallOfFame(days = 14) {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }));
  }
  try {
    const { data: games } = await supabase
      .from('games').select('id, game_number, date').in('date', dates).order('date', { ascending: false });

    if (!games?.length) return [];

    const { data: attempts } = await supabase
      .from('attempts')
      .select('game_id, device_id, username, clues_used, total_time_ms')
      .in('game_id', games.map(g => g.id))
      .eq('solved', true)
      .order('clues_used', { ascending: true })
      .order('total_time_ms', { ascending: true });

    const bestByGame = {};
    for (const a of attempts ?? []) {
      if (!bestByGame[a.game_id]) bestByGame[a.game_id] = a;
    }

    return games.map(g => {
      const best = bestByGame[g.id] ?? null;
      return {
        date: g.date,
        gameNumber: g.game_number,
        champion: best ? {
          name: getDisplayName(best.username, best.device_id),
          cluesUsed: best.clues_used,
          totalTimeMs: best.total_time_ms,
        } : null,
      };
    });
  } catch {
    return [];
  }
}

export default async function ChampionPage() {
  const [{ todayAEST, gameNumber, champion, totalAttempts }, hallOfFame] = await Promise.all([
    getTodayChampion(),
    getHallOfFame(14),
  ]);

  // Streak: count consecutive days this champion has won (from hall of fame data)
  let streak = 1;
  if (champion) {
    for (let i = 1; i < hallOfFame.length; i++) {
      if (hallOfFame[i].champion?.name === champion.name) {
        streak++;
      } else {
        break;
      }
    }
  }

  // Multi-winner counts across 14 days (for 👑 display)
  const winnerCounts = {};
  for (const { champion: c } of hallOfFame) {
    if (c) winnerCounts[c.name] = (winnerCounts[c.name] || 0) + 1;
  }

  // Beat percentage — only show when enough players have played
  const beatPct = totalAttempts >= 20
    ? Math.round(((totalAttempts - 1) / totalAttempts) * 100)
    : null;

  // Only display 10 days in the UI
  const displayEntries = hallOfFame.slice(0, 10);

  return (
    <div className="bg-texture min-h-screen text-white flex flex-col">
      <Nav />

      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto space-y-8">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="text-center pt-4">
          <div className="text-7xl mb-3" aria-hidden>🏆</div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-1">
            Today&apos;s Champion
          </h1>
          <p className="text-sm text-gray-500 mb-6">Fastest solve. Cleanest flex.</p>

          {champion ? (
            <>
              <p className="text-4xl sm:text-5xl font-black mb-2 text-white">{champion.name}</p>
              <p className="text-base font-bold mb-5" style={{ color: '#f6b91f' }}>
                {getTitleForClues(champion.cluesUsed)}
              </p>

              {/* Stats row */}
              <div className="flex items-center justify-center gap-6 mb-3">
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{champion.cluesUsed}</p>
                  <p className="text-xs text-gray-600 uppercase tracking-wider">clues</p>
                </div>
                <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{formatSeconds(champion.totalTimeMs)}</p>
                  <p className="text-xs text-gray-600 uppercase tracking-wider">time</p>
                </div>
                <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{streak}</p>
                  <p className="text-xs text-gray-600 uppercase tracking-wider">day streak</p>
                </div>
              </div>

              {beatPct !== null && (
                <p className="text-xs text-gray-500 mb-1">
                  Beat <span className="text-[#00e676] font-bold">{beatPct}%</span> of players today
                </p>
              )}
              {gameNumber && <p className="text-xs text-gray-600">Game #{gameNumber}</p>}
            </>
          ) : (
            <>
              <p className="text-2xl font-black text-gray-600 mb-2">No champion yet</p>
              <p className="text-sm text-gray-600 mb-4">Be the first to crack today&apos;s game</p>
              <Link
                href="/play"
                className="inline-block font-bold px-6 py-3 rounded-xl text-sm text-black"
                style={{ background: '#00e676' }}
              >
                Play now →
              </Link>
            </>
          )}
        </section>

        {/* ── Shareable card ────────────────────────────────────────────── */}
        <section>
          <ChampionImage date={todayAEST} />
        </section>

        {/* ── Wall of Fame ──────────────────────────────────────────────── */}
        <section>
          <div className="mb-2">
            <h2
              className="text-lg font-black text-white inline-block pb-1"
              style={{ borderBottom: '2px solid rgba(246,185,31,0.5)' }}
            >
              Wall of Fame 🏅
            </h2>
            <p className="text-xs text-gray-600 mt-1.5">
              All-time champions. The ones who cracked it first.
            </p>
          </div>

          {displayEntries.length === 0 && (
            <p className="text-gray-600 text-sm mt-4">No games played yet.</p>
          )}

          {displayEntries.length > 0 && (
            <div className="space-y-2 mt-4">
              {displayEntries.map(({ date, gameNumber: gNum, champion: c }, i) => {
                const isToday = date === todayAEST;
                const isMultiWinner = c && winnerCounts[c.name] > 1;
                const isTopEntry = i === 0 && !!c;

                return (
                  <div
                    key={date}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: isToday ? 'rgba(0,230,118,0.05)' : 'rgba(255,255,255,0.03)',
                      borderTop: '1px solid ' + (isToday ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)'),
                      borderRight: '1px solid ' + (isToday ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)'),
                      borderBottom: '1px solid ' + (isToday ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)'),
                      borderLeft: isTopEntry
                        ? '3px solid #f6b91f'
                        : '1px solid ' + (isToday ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)'),
                    }}
                  >
                    <div className="flex-shrink-0 w-8 text-center">
                      {isMultiWinner
                        ? <span className="text-lg">👑</span>
                        : c
                          ? <span className="text-base">🏅</span>
                          : <span className="text-gray-700 text-xs">—</span>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-gray-300'}`}>
                        {isToday ? 'Today' : formatDisplayDate(date)}
                      </p>
                      <p className="text-xs text-gray-600">Game #{gNum}</p>
                    </div>

                    {c ? (
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-semibold ${isToday ? 'text-[#00e676]' : 'text-white'}`}>
                          {c.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatClues(c.cluesUsed)} · {formatSeconds(c.totalTimeMs)}
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
