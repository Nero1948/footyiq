import { supabase } from '@/lib/supabase';

export async function GET() {
  const todayAEST = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Australia/Sydney',
  });

  // ── Get today's game ───────────────────────────────────────────────────────

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, game_number')
    .eq('date', todayAEST)
    .single();

  if (gameError) {
    if (gameError.code === 'PGRST116') {
      return Response.json({ error: 'No game today' }, { status: 404 });
    }
    return Response.json({ error: 'Failed to load game' }, { status: 500 });
  }

  // ── Fetch top 50 solved attempts for this game ─────────────────────────────

  const { data: attempts, error: attemptsError } = await supabase
    .from('attempts')
    .select('device_id, clues_used, total_time_ms, created_at')
    .eq('game_id', game.id)
    .eq('solved', true)
    .order('clues_used', { ascending: true })
    .order('total_time_ms', { ascending: true })
    .limit(50);

  if (attemptsError) {
    return Response.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }

  const entries = attempts.map((attempt, index) => ({
    rank: index + 1,
    deviceSuffix: attempt.device_id.slice(-4),
    cluesUsed: attempt.clues_used,
    totalTimeMs: attempt.total_time_ms,
    createdAt: attempt.created_at,
    // Full device_id included only for client-side "is this me?" highlighting.
    // It never renders in the UI — only the last 4 chars do.
    deviceId: attempt.device_id,
  }));

  // ── Aggregate stats for the landing page ──────────────────────────────────

  // Total attempts for today (solved + unsolved)
  const { count: totalAttempts } = await supabase
    .from('attempts')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', game.id);

  // All solved attempts' clues_used to compute avg + % in 1 clue
  const { data: solvedClues } = await supabase
    .from('attempts')
    .select('clues_used')
    .eq('game_id', game.id)
    .eq('solved', true);

  let avgClues = null;
  let oneCluePercent = 0;

  if (solvedClues && solvedClues.length > 0) {
    const total = solvedClues.reduce((sum, a) => sum + a.clues_used, 0);
    avgClues = (total / solvedClues.length).toFixed(1);
    const oneClue = solvedClues.filter((a) => a.clues_used === 1).length;
    oneCluePercent = Math.round((oneClue / solvedClues.length) * 100);
  }

  return Response.json({
    gameId: game.id,
    gameNumber: game.game_number,
    entries,
    stats: {
      totalAttempts: totalAttempts ?? 0,
      solvedCount: solvedClues?.length ?? 0,
      avgClues,
      oneCluePercent,
    },
  });
}
