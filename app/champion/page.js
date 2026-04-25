import Link from 'next/link';
import Nav from '../components/Nav';
import WallOfFame from './WallOfFame';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const todayAEST = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  const cardUrl = `https://www.setforsix.com/api/champion?date=${todayAEST}`;
  return {
    title: 'Set For Six — Champions',
    description: 'Meet the fastest NRL guessers. Who cracked it first today?',
    openGraph: {
      title: 'Set For Six — Champions',
      description: 'Meet the fastest NRL guessers. Who cracked it first today?',
      url: 'https://www.setforsix.com/champion',
      images: [{ url: cardUrl, width: 1200, height: 630, alt: "Today's Set For Six champion" }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Set For Six — Champions',
      description: 'Meet the fastest NRL guessers. Who cracked it first today?',
      images: [cardUrl],
    },
  };
}

function formatSeconds(ms) { return (ms / 1000).toFixed(1) + 's'; }

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
        deviceId: top.device_id,
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
          deviceId: best.device_id,
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
      if (hallOfFame[i].champion?.deviceId === champion.deviceId) {
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
            <div
              className="rounded-2xl px-5 py-6"
              style={{
                background: 'linear-gradient(180deg, rgba(246,185,31,0.10), rgba(255,255,255,0.03))',
                border: '1px solid rgba(246,185,31,0.28)',
                boxShadow: '0 0 36px rgba(246,185,31,0.08)',
              }}
            >
              {gameNumber && (
                <p className="text-xs font-bold uppercase tracking-[0.24em] mb-3" style={{ color: '#f6b91f' }}>
                  Game #{gameNumber}
                </p>
              )}
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
            </div>
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

          <WallOfFame
            entries={displayEntries}
            todayAEST={todayAEST}
            winnerCounts={winnerCounts}
          />
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
