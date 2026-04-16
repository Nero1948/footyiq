import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

const FALLBACK_NAMES = ['Mystery Fan', 'Secret Selector', 'Phantom Tipper', 'Ghost Player', 'Undercover Footy Brain', 'Anonymous Legend'];

function getFallbackName(deviceId) {
  let h = 0;
  for (let i = 0; i < deviceId.length; i++) h = (h * 31 + deviceId.charCodeAt(i)) & 0x7fffffff;
  return FALLBACK_NAMES[h % FALLBACK_NAMES.length];
}

const W = 1200;
const H = 630;

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const dateParam =
    searchParams.get('date') ??
    new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return new Response('Invalid date format. Use YYYY-MM-DD.', { status: 400 });
  }

  // ── Fetch game ─────────────────────────────────────────────────────────────

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, game_number')
    .eq('date', dateParam)
    .single();

  if (gameError || !game) return renderNoChampion(dateParam);

  // ── Fetch top 2 solved attempts (for beat-the-field line) ─────────────────

  const { data: attempts, error: attemptsError } = await supabase
    .from('attempts')
    .select('device_id, username, clues_used, total_time_ms')
    .eq('game_id', game.id)
    .eq('solved', true)
    .order('clues_used', { ascending: true })
    .order('total_time_ms', { ascending: true })
    .limit(2);

  if (attemptsError || !attempts || attempts.length === 0) {
    return renderNoChampion(dateParam);
  }

  const champion = attempts[0];
  const secondPlace = attempts[1] ?? null;

  // ── Fetch total solved count ───────────────────────────────────────────────

  const { count: totalSolved } = await supabase
    .from('attempts')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', game.id)
    .eq('solved', true);

  // ── Compute champion streak ────────────────────────────────────────────────

  let streak = 1;
  try {
    const last14Dates = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last14Dates.push(d.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }));
    }

    const { data: prevGames } = await supabase
      .from('games')
      .select('id, date')
      .in('date', last14Dates)
      .order('date', { ascending: false });

    if (prevGames && prevGames.length > 0) {
      const { data: prevAttempts } = await supabase
        .from('attempts')
        .select('game_id, device_id, clues_used, total_time_ms')
        .in('game_id', prevGames.map((g) => g.id))
        .eq('solved', true)
        .order('clues_used', { ascending: true })
        .order('total_time_ms', { ascending: true });

      if (prevAttempts) {
        const bestByGame = {};
        for (const a of prevAttempts) {
          if (!bestByGame[a.game_id]) bestByGame[a.game_id] = a;
        }
        for (const g of prevGames) {
          if (bestByGame[g.id]?.device_id === champion.device_id) {
            streak++;
          } else {
            break;
          }
        }
      }
    }
  } catch {
    // streak stays at 1
  }

  // ── Derived display values ─────────────────────────────────────────────────

  const winnerName = (champion.username && champion.username !== 'Anonymous')
    ? champion.username
    : getFallbackName(champion.device_id);

  const cluesUsed  = champion.clues_used;
  const cluesStr   = String(cluesUsed);
  const clueWord   = cluesUsed === 1 ? 'clue' : 'clues';
  const timeStr    = `${(champion.total_time_ms / 1000).toFixed(1)}s`;
  const streakStr  = String(streak);
  const gameLabel  = `Game #${game.game_number}`;

  const displayDate = new Date(dateParam + 'T12:00:00Z').toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).toUpperCase();

  const datePill = `${displayDate} · ${gameLabel}`;

  const beatBySecs = secondPlace && secondPlace.clues_used === cluesUsed
    ? Math.max(0, (secondPlace.total_time_ms - champion.total_time_ms) / 1000).toFixed(1)
    : null;

  const descriptionLine = beatBySecs !== null
    ? `Nailed today's player in ${cluesStr} ${clueWord} and beat the field by ${beatBySecs}s`
    : `Nailed today's player in ${cluesStr} ${clueWord}`;

  return new ImageResponse(
    (
      <div style={{
        width: W,
        height: H,
        backgroundColor: '#07111f',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
      }}>

        {/* ── Top gold band ─────────────────────────────────────────────── */}
        <div style={{
          height: 80,
          background: 'linear-gradient(90deg, #fff4c2, #f6b91f)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px',
          flexShrink: 0,
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              background: 'linear-gradient(135deg, #f6b91f, #c8860a)',
              border: '2px solid rgba(0,0,0,0.18)',
              borderRadius: 10,
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 900,
              color: '#000',
            }}>6</div>
            <span style={{ color: '#000', fontSize: 26, fontWeight: 900, letterSpacing: 3 }}>
              SET FOR SIX
            </span>
          </div>
          {/* Date pill */}
          <div style={{
            border: '1px solid rgba(0,0,0,0.2)',
            borderRadius: 20,
            padding: '6px 20px',
            fontSize: 14,
            fontWeight: 600,
            color: 'rgba(0,0,0,0.55)',
          }}>
            {datePill}
          </div>
        </div>

        {/* ── Main section ──────────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 80px 20px',
        }}>

          {/* Rank chip */}
          <div style={{
            background: 'linear-gradient(90deg, #fff4c2, #f6b91f)',
            borderRadius: 24,
            padding: '6px 22px',
            fontSize: 15,
            fontWeight: 800,
            color: '#000',
            marginBottom: 14,
          }}>
            🏆 #1 Today
          </div>

          {/* Green eyebrow */}
          <div style={{
            color: '#00e676',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 10,
            marginBottom: 10,
          }}>
            TOP DOG
          </div>

          {/* Winner name */}
          <div style={{
            color: '#ffffff',
            fontSize: 56,
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 10,
            textAlign: 'center',
          }}>
            {winnerName}
          </div>

          {/* Description */}
          <div style={{
            color: '#4a6a8a',
            fontSize: 17,
            marginBottom: 24,
            textAlign: 'center',
          }}>
            {descriptionLine}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
            {[
              { label: 'CLUES',  value: cluesStr  },
              { label: 'TIME',   value: timeStr   },
              { label: 'STREAK', value: streakStr },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '14px 44px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ color: '#fff', fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{value}</span>
                <span style={{ color: '#f6b91f', fontSize: 11, fontWeight: 700, letterSpacing: 4 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Callout box */}
          <div style={{
            borderLeft: '3px solid #f6b91f',
            border: '1px solid rgba(246,185,31,0.3)',
            borderRadius: 8,
            padding: '11px 24px',
            background: 'rgba(246,185,31,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            maxWidth: 680,
          }}>
            <span style={{ color: '#f6b91f', fontSize: 11, fontWeight: 700, letterSpacing: 5 }}>
              OFFICIAL RULING
            </span>
            <span style={{ color: '#7a8fa8', fontSize: 15 }}>
              Certified group chat menace. Knows far too much ball.
            </span>
          </div>

        </div>

        {/* ── Bottom gold band ──────────────────────────────────────────── */}
        <div style={{
          height: 58,
          background: 'linear-gradient(90deg, #fff4c2, #f6b91f)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px',
          flexShrink: 0,
        }}>
          <span style={{ color: '#000', fontSize: 16, fontWeight: 900 }}>setforsix.com</span>
          <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, fontWeight: 500 }}>
            Daily NRL guessing game for proper league tragics
          </span>
        </div>

      </div>
    ),
    { width: W, height: H }
  );
}

// ── No champion yet ────────────────────────────────────────────────────────────

function renderNoChampion(dateParam) {
  const displayDate = new Date(dateParam + 'T12:00:00Z').toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).toUpperCase();

  return new ImageResponse(
    (
      <div style={{
        width: W,
        height: H,
        backgroundColor: '#07111f',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
      }}>

        {/* Top band */}
        <div style={{
          height: 80,
          background: 'linear-gradient(90deg, #fff4c2, #f6b91f)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'linear-gradient(135deg, #f6b91f, #c8860a)', border: '2px solid rgba(0,0,0,0.18)', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#000' }}>6</div>
            <span style={{ color: '#000', fontSize: 26, fontWeight: 900, letterSpacing: 3 }}>SET FOR SIX</span>
          </div>
          <div style={{ border: '1px solid rgba(0,0,0,0.2)', borderRadius: 20, padding: '6px 20px', fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.55)' }}>{displayDate}</div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#1a2e42', fontSize: 15, fontWeight: 700, letterSpacing: 12, marginBottom: 28 }}>TODAY'S WINNER</div>
          <div style={{ color: '#1a2e42', fontSize: 96, fontWeight: 900, lineHeight: 1, marginBottom: 24 }}>???</div>
          <div style={{ color: '#f6b91f', fontSize: 17, fontWeight: 700, letterSpacing: 8 }}>NO CHAMPION YET</div>
          <div style={{ color: '#1a2e42', fontSize: 15, letterSpacing: 3, marginTop: 16 }}>{displayDate}</div>
        </div>

        {/* Bottom band */}
        <div style={{ height: 58, background: 'linear-gradient(90deg, #fff4c2, #f6b91f)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', flexShrink: 0 }}>
          <span style={{ color: '#000', fontSize: 16, fontWeight: 900 }}>setforsix.com</span>
          <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>Be the first to crack it today</span>
        </div>

      </div>
    ),
    { width: W, height: H }
  );
}
