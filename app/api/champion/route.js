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

  // ── Fetch #1 attempt ───────────────────────────────────────────────────────

  const { data: attempts, error: attemptsError } = await supabase
    .from('attempts')
    .select('device_id, clues_used, total_time_ms')
    .eq('game_id', game.id)
    .eq('solved', true)
    .order('clues_used', { ascending: true })
    .order('total_time_ms', { ascending: true })
    .limit(1);

  if (attemptsError || !attempts || attempts.length === 0) {
    return renderNoChampion(dateParam);
  }

  const champion = attempts[0];

  const { count: totalSolved } = await supabase
    .from('attempts')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', game.id)
    .eq('solved', true);

  // ── Derived display values ─────────────────────────────────────────────────
  // All dynamic text pre-built as plain strings so each JSX node has one child.

  const deviceSuffix = champion.device_id.slice(-4);
  const playerLabel  = `\u2026${deviceSuffix}`;
  const cluesStr     = String(champion.clues_used);
  const clueLabel    = champion.clues_used === 1 ? 'CLUE' : 'CLUES';
  const timeStr      = `${(champion.total_time_ms / 1000).toFixed(1)}s`;
  const total        = totalSolved ?? 1;
  const rankLabel    = `OF ${total} ${total === 1 ? 'PLAYER' : 'PLAYERS'}`;
  const displayDate  = new Date(dateParam + 'T12:00:00Z').toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const gameLabel    = `GAME #${game.game_number}`;
  const dateLabel    = displayDate.toUpperCase();

  return new ImageResponse(
    (
      // ── Root ────────────────────────────────────────────────────────────────
      // Black base + green diagonal sash faked with a linear-gradient band.
      // All dynamic content is pre-built strings — every multi-child div has display:flex.
      <div style={{
        width: W,
        height: H,
        background: 'linear-gradient(118deg, #000000 32%, rgba(0,230,118,0.13) 32%, rgba(0,230,118,0.13) 56%, #000000 56%)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
      }}>

        {/* ── TOP BAR: gold newspaper banner ────────────────────────────── */}
        <div style={{
          height: 80,
          background: '#ffb800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 52px',
          flexShrink: 0,
        }}>
          <div style={{ color: '#000000', fontSize: 34, fontWeight: 900, letterSpacing: 3 }}>
            {'FOOTYIQ'}
          </div>
          <div style={{ color: '#000000', fontSize: 20, fontWeight: 800, letterSpacing: 8 }}>
            {'DAILY CHAMPION'}
          </div>
        </div>

        {/* ── MAIN SECTION ──────────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          padding: '0 80px',
        }}>

          {/* "TODAY'S WINNER" label */}
          <div style={{
            color: '#2a2a2a',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 12,
            marginBottom: 18,
          }}>
            {"TODAY'S WINNER"}
          </div>

          {/* Player ID — biggest element */}
          <div style={{
            color: '#ffffff',
            fontSize: 148,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -6,
            marginBottom: 20,
          }}>
            {playerLabel}
          </div>

          {/* Game + date row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 22,
          }}>
            <div style={{ color: '#00e676', fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>
              {gameLabel}
            </div>
            <div style={{ width: 4, height: 4, borderRadius: 2, background: '#333333' }} />
            <div style={{ color: '#444444', fontSize: 18, letterSpacing: 2 }}>
              {dateLabel}
            </div>
          </div>

          {/* Gold "FIRST TO CRACK IT" */}
          <div style={{
            color: '#ffb800',
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: 8,
          }}>
            {'FIRST TO CRACK IT'}
          </div>

        </div>

        {/* ── STATS BAR ─────────────────────────────────────────────────── */}
        <div style={{
          height: 128,
          background: '#0d0d0d',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}>

          {/* Clues */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ color: '#ffffff', fontSize: 68, fontWeight: 900, lineHeight: 1 }}>
              {cluesStr}
            </div>
            <div style={{ color: '#ffb800', fontSize: 12, fontWeight: 700, letterSpacing: 5 }}>
              {clueLabel}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 72, background: 'rgba(255,184,0,0.3)' }} />

          {/* Time */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ color: '#ffffff', fontSize: 68, fontWeight: 900, lineHeight: 1 }}>
              {timeStr}
            </div>
            <div style={{ color: '#ffb800', fontSize: 12, fontWeight: 700, letterSpacing: 5 }}>
              {'TIME'}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 72, background: 'rgba(255,184,0,0.3)' }} />

          {/* Rank */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ color: '#ffffff', fontSize: 68, fontWeight: 900, lineHeight: 1 }}>
              {'1st'}
            </div>
            <div style={{ color: '#ffb800', fontSize: 12, fontWeight: 700, letterSpacing: 5 }}>
              {rankLabel}
            </div>
          </div>

        </div>

        {/* ── BOTTOM BAR: gold call to action ───────────────────────────── */}
        <div style={{
          height: 62,
          background: '#ffb800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <div style={{ color: '#000000', fontSize: 20, fontWeight: 800, letterSpacing: 3 }}>
            {'Think you can do better?  footyiq.au'}
          </div>
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
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
      }}>

        {/* Top bar */}
        <div style={{
          height: 80,
          background: '#ffb800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 52px',
        }}>
          <div style={{ color: '#000000', fontSize: 34, fontWeight: 900, letterSpacing: 3 }}>
            {'FOOTYIQ'}
          </div>
          <div style={{ color: '#000000', fontSize: 20, fontWeight: 800, letterSpacing: 8 }}>
            {'DAILY CHAMPION'}
          </div>
        </div>

        {/* Main */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
        }}>
          <div style={{ color: '#2a2a2a', fontSize: 15, fontWeight: 700, letterSpacing: 12, marginBottom: 28 }}>
            {"TODAY'S WINNER"}
          </div>
          <div style={{ color: '#333333', fontSize: 96, fontWeight: 900, lineHeight: 1, marginBottom: 24 }}>
            {'???'}
          </div>
          <div style={{ color: '#ffb800', fontSize: 17, fontWeight: 700, letterSpacing: 8 }}>
            {'NO CHAMPION YET'}
          </div>
          <div style={{ color: '#333333', fontSize: 16, letterSpacing: 3, marginTop: 20 }}>
            {displayDate}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          height: 62,
          background: '#ffb800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ color: '#000000', fontSize: 20, fontWeight: 800, letterSpacing: 3 }}>
            {'Be the first.  footyiq.au'}
          </div>
        </div>

      </div>
    ),
    { width: W, height: H }
  );
}
