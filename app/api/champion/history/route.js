import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

// Returns champion data for the last N days (default 7), most recent first.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') ?? '7', 10), 30);

  const results = [];

  // Build an array of the last `days` dates in AEST, most recent first
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    results.push(
      d.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
    );
  }

  // Fetch all games for those dates in one query
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, game_number, date')
    .in('date', results)
    .order('date', { ascending: false });

  if (gamesError) {
    return Response.json({ error: 'Failed to load games' }, { status: 500 });
  }

  if (!games || games.length === 0) {
    return Response.json({ champions: [] });
  }

  const gameIds = games.map((g) => g.id);

  // Fetch the top attempt per game in one query, ordered so we can pick rank 1 per game
  const { data: attempts, error: attemptsError } = await supabase
    .from('attempts')
    .select('game_id, device_id, clues_used, total_time_ms')
    .in('game_id', gameIds)
    .eq('solved', true)
    .order('clues_used', { ascending: true })
    .order('total_time_ms', { ascending: true });

  if (attemptsError) {
    return Response.json({ error: 'Failed to load attempts' }, { status: 500 });
  }

  // Pick the first (best) attempt per game_id
  const bestByGame = {};
  for (const attempt of attempts ?? []) {
    if (!bestByGame[attempt.game_id]) {
      bestByGame[attempt.game_id] = attempt;
    }
  }

  const champions = games.map((game) => {
    const best = bestByGame[game.id] ?? null;
    return {
      date: game.date,
      gameNumber: game.game_number,
      champion: best
        ? {
            deviceSuffix: best.device_id.slice(-4),
            cluesUsed: best.clues_used,
            totalTimeMs: best.total_time_ms,
          }
        : null,
    };
  });

  return Response.json({ champions });
}
