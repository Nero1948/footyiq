import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export async function GET() {
  // Yesterday in AEST
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayAEST = yesterday.toLocaleDateString('en-CA', {
    timeZone: 'Australia/Sydney',
  });

  // ── Fetch yesterday's game ─────────────────────────────────────────────────

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, game_number, answer_player, facts, drama')
    .eq('date', yesterdayAEST)
    .single();

  if (gameError) {
    if (gameError.code === 'PGRST116') {
      return Response.json({ error: 'No game yesterday' }, { status: 404 });
    }
    return Response.json({ error: 'Failed to load game' }, { status: 500 });
  }

  // ── Compute stats ──────────────────────────────────────────────────────────

  const { data: solvedClues, error: statsError } = await supabase
    .from('attempts')
    .select('clues_used')
    .eq('game_id', game.id)
    .eq('solved', true);

  if (statsError) {
    return Response.json({ error: 'Failed to load stats' }, { status: 500 });
  }

  const solvedCount = solvedClues?.length ?? 0;
  const oneClue = solvedClues?.filter((a) => a.clues_used === 1).length ?? 0;
  const oneCluePercent = solvedCount > 0 ? Math.round((oneClue / solvedCount) * 100) : 0;

  return Response.json({
    answer: game.answer_player,
    gameNumber: game.game_number,
    date: yesterdayAEST,
    solvedCount,
    oneCluePercent,
    facts: game.facts ?? [],
    drama: game.drama ?? null,
  });
}
