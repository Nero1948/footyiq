import { supabase } from '@/lib/supabase';

export async function GET(request) {
  // ── Auth ───────────────────────────────────────────────────────────────────

  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = request.headers.get('x-cron-secret');

  if (!cronSecret || headerSecret !== cronSecret) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // ── Run ────────────────────────────────────────────────────────────────────

  try {
    const now = new Date();

    const todayAEST = now.toLocaleDateString('en-CA', {
      timeZone: 'Australia/Sydney',
    });

    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayAEST = yesterdayDate.toLocaleDateString('en-CA', {
      timeZone: 'Australia/Sydney',
    });

    // ── Check today's game exists ──────────────────────────────────────────

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, game_number')
      .eq('date', todayAEST)
      .single();

    const gameExists = !gameError && !!game;

    if (!gameExists) {
      console.warn(
        `[daily-reset] WARNING: No game found for today (${todayAEST}). ` +
        `Add a game row before players start.`
      );
    } else {
      console.log(
        `[daily-reset] Today's game: #${game.game_number} (${todayAEST}). ` +
        `Yesterday: ${yesterdayAEST}.`
      );
    }

    return Response.json({
      success: true,
      date: todayAEST,
      yesterday: yesterdayAEST,
      gameExists,
    });
  } catch (err) {
    console.error('[daily-reset] Unexpected error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
