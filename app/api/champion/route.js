import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

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

  // ── Fetch top 2 solved attempts (for beat-the-field calculation) ───────────

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

  // ── Fetch total attempts (all players, solved or not) ──────────────────────

  const { count: totalAttempts } = await supabase
    .from('attempts')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', game.id);

  // ── Fetch total solved count ───────────────────────────────────────────────

  const { count: totalSolved } = await supabase
    .from('attempts')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', game.id)
    .eq('solved', true);

  // ── Derived display values ─────────────────────────────────────────────────

  const winnerName = (champion.username && champion.username !== 'Anonymous')
    ? champion.username
    : `…${champion.device_id.slice(-4)}`;

  const cluesUsed   = champion.clues_used;
  const cluesStr    = String(cluesUsed);
  const clueWord    = cluesUsed === 1 ? 'clue' : 'clues';
  const timeStr     = `${(champion.total_time_ms / 1000).toFixed(1)}s`;
  const playersStr  = String(totalAttempts ?? 1);
  const gameLabel   = `GAME #${game.game_number}`;

  // Beat-the-field: only show when a second place exists and has same clue count
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
        background: '#060606',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
      }}>

        {/* ── Gold header band ──────────────────────────────────────────── */}
        <div style={{
          height: 82,
          background: 'linear-gradient(90deg, #b8730a 0%, #ffc535 45%, #d4890c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 52px',
          flexShrink: 0,
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ color: '#000', fontSize: 28, fontWeight: 900, letterSpacing: 3 }}>
              SET FOR SIX
            </span>
            <div style={{
              background: '#000',
              color: '#ffc535',
              borderRadius: 8,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 900,
            }}>
              6
            </div>
            <span style={{ color: 'rgba(0,0,0,0.4)', fontSize: 15, fontWeight: 600, marginLeft: 8 }}>
              {gameLabel}
            </span>
          </div>
          {/* Rank chip */}
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            color: '#000',
            borderRadius: 28,
            padding: '8px 22px',
            fontSize: 17,
            fontWeight: 800,
          }}>
            🏆 #1 Today
          </div>
        </div>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 80px 24px',
        }}>

          {/* Top Dog eyebrow */}
          <div style={{
            color: '#00e676',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 12,
            marginBottom: 14,
          }}>
            TOP DOG
          </div>

          {/* Winner name */}
          <div style={{
            color: '#ffffff',
            fontSize: 108,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -4,
            marginBottom: 18,
          }}>
            {winnerName}
          </div>

          {/* Description */}
          <div style={{
            color: '#666',
            fontSize: 18,
            marginBottom: 32,
            textAlign: 'center',
          }}>
            {descriptionLine}
          </div>

          {/* Stat boxes */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'CLUES',   value: cluesStr  },
              { label: 'TIME',    value: timeStr   },
              { label: 'PLAYERS', value: playersStr },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '14px 38px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ color: '#fff', fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{value}</span>
                <span style={{ color: '#ffc535', fontSize: 11, fontWeight: 700, letterSpacing: 5 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Official ruling callout */}
          <div style={{
            borderLeft: '3px solid #ffc535',
            border: '1px solid rgba(255,197,53,0.25)',
            borderRadius: 8,
            padding: '12px 24px',
            background: 'rgba(255,197,53,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxWidth: 680,
          }}>
            <span style={{ color: '#ffc535', fontSize: 11, fontWeight: 700, letterSpacing: 5 }}>
              OFFICIAL RULING
            </span>
            <span style={{ color: '#aaa', fontSize: 15 }}>
              Certified group chat menace. Knows far too much ball.
            </span>
          </div>

        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div style={{
          height: 54,
          background: '#0d0d0d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          flexShrink: 0,
        }}>
          <span style={{ color: '#ffc535', fontSize: 16, fontWeight: 800 }}>setforsix.com.au</span>
          <span style={{ color: '#333', fontSize: 18 }}>·</span>
          <span style={{ color: '#444', fontSize: 14 }}>Daily NRL guessing game for proper league tragics</span>
        </div>

      </div>
    ),
    { width: W, height: H }
  );
}

// ── No champion yet ────────────────────────────────────────────────────────────

function renderNoChampion(dateParam) {
  const displayDate = new Date(dateParam + 'T12:00:00Z').toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).toUpperCase();

  return new ImageResponse(
    (
      <div style={{
        width: W,
        height: H,
        background: '#060606',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
      }}>

        {/* Header */}
        <div style={{
          height: 82,
          background: 'linear-gradient(90deg, #b8730a 0%, #ffc535 45%, #d4890c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 52px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ color: '#000', fontSize: 28, fontWeight: 900, letterSpacing: 3 }}>SET FOR SIX</span>
            <div style={{ background: '#000', color: '#ffc535', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900 }}>6</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.25)', color: '#000', borderRadius: 28, padding: '8px 22px', fontSize: 17, fontWeight: 800 }}>
            🏆 Daily Champion
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          <div style={{ color: '#222', fontSize: 15, fontWeight: 700, letterSpacing: 12, marginBottom: 28 }}>TODAY'S WINNER</div>
          <div style={{ color: '#2a2a2a', fontSize: 96, fontWeight: 900, lineHeight: 1, marginBottom: 24 }}>???</div>
          <div style={{ color: '#ffc535', fontSize: 17, fontWeight: 700, letterSpacing: 8 }}>NO CHAMPION YET</div>
          <div style={{ color: '#2a2a2a', fontSize: 16, letterSpacing: 3, marginTop: 20 }}>{displayDate}</div>
        </div>

        {/* Footer */}
        <div style={{ height: 54, background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexShrink: 0 }}>
          <span style={{ color: '#ffc535', fontSize: 16, fontWeight: 800 }}>setforsix.com.au</span>
          <span style={{ color: '#333', fontSize: 18 }}>·</span>
          <span style={{ color: '#444', fontSize: 14 }}>Be the first. setforsix.com.au</span>
        </div>

      </div>
    ),
    { width: W, height: H }
  );
}
