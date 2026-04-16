import Link from 'next/link';
import Nav from '../components/Nav';
import ChampionImage from './ChampionImage';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Set For Six — Daily Champions',
  description: 'Meet the fastest NRL guessers. Who cracked it first today?',
};

function formatSeconds(ms) { return (ms / 1000).toFixed(1) + 's'; }
function formatClues(n) { return n === 1 ? '1 clue' : `${n} clues`; }
function formatDisplayDate(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

async function getTodayChampion() {
  const todayAEST = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  try {
    const { data: game } = await supabase
      .from('games').select('id, game_number').eq('date', todayAEST).single();

    if (!game) return { todayAEST, gameNumber: null, champion: null };

    const { data: attempts } = await supabase
      .from('attempts')
      .select('device_id, username, clues_used, total_time_ms')
      .eq('game_id', game.id)
      .eq('solved', true)
      .order('clues_used', { ascending: true })
      .order('total_time_ms', { ascending: true })
      .limit(1);

    const top = attempts?.[0] ?? null;
    return {
      todayAEST,
      gameNumber: game.game_number,
      champion: top ? {
        name: (top.username && top.username !== 'Anonymous') ? top.username : `…${top.device_id.slice(-4)}`,
        cluesUsed: top.clues_used,
        totalTimeMs: top.total_time_ms,
      } : null,
    };
  } catch {
    const todayAEST = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    return { todayAEST, gameNumber: null, champion: null };
  }
}

async function getHallOfFame(days = 7) {
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
          name: (best.username && best.username !== 'Anonymous') ? best.username : `…${best.device_id.slice(-4)}`,
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
  const [{ todayAEST, gameNumber, champion }, hallOfFame] = await Promise.all([
    getTodayChampion(),
    getHallOfFame(7),
  ]);

  return (
    <div className="bg-texture min-h-screen text-white flex flex-col">
      <Nav />

      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto space-y-8">

        {/* ── Hero trophy + today's champion ──────────────────────────── */}
        <section className="text-center pt-4">
          <div className="text-7xl mb-3" aria-hidden>🏆</div>
          <p
            className="text-xs font-black tracking-[0.35em] uppercase mb-3"
            style={{ color: '#f6b91f' }}
          >
            Today&apos;s Champion
          </p>

          {champion ? (
            <>
              <h1
                className="text-4xl sm:text-5xl font-black tracking-tight mb-2"
                style={{ color: '#ffffff' }}
              >
                {champion.name}
              </h1>
              <p className="text-sm text-gray-500 mb-1">
                {formatClues(champion.cluesUsed)} · {formatSeconds(champion.totalTimeMs)}
                {gameNumber ? ` · Game #${gameNumber}` : ''}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black text-gray-600 mb-2">No champion yet</h1>
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

        {/* ── Champion OG image ────────────────────────────────────────── */}
        <section>
          <ChampionImage date={todayAEST} />
        </section>

        {/* ── Wall of Fame ──────────────────────────────────────────────── */}
        <section>
          <div className="mb-4">
            <h2
              className="text-lg font-black text-white inline-block pb-1"
              style={{ borderBottom: '2px solid rgba(246,185,31,0.5)' }}
            >
              Wall of Fame
            </h2>
          </div>

          {hallOfFame.length === 0 && (
            <p className="text-gray-600 text-sm">No games played yet.</p>
          )}

          {hallOfFame.length > 0 && (
            <div className="space-y-2">
              {hallOfFame.map(({ date, gameNumber: gNum, champion: c }) => {
                const isToday = date === todayAEST;
                return (
                  <div
                    key={date}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: isToday ? 'rgba(0,230,118,0.05)' : 'rgba(255,255,255,0.03)',
                      border: isToday ? '1px solid rgba(0,230,118,0.2)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Left: crown + game number */}
                    <div className="flex-shrink-0 w-10 text-center">
                      {c ? (
                        <span className="text-lg">👑</span>
                      ) : (
                        <span className="text-gray-700 text-xs">—</span>
                      )}
                    </div>

                    {/* Middle: date */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-gray-300'}`}>
                        {isToday ? 'Today' : formatDisplayDate(date)}
                      </p>
                      <p className="text-xs text-gray-600">Game #{gNum}</p>
                    </div>

                    {/* Right: winner */}
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
