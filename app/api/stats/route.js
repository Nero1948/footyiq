import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export async function GET() {
  const todayAEST = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Australia/Sydney',
  });

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id')
    .eq('date', todayAEST)
    .single();

  if (gameError) {
    return Response.json({ error: 'No game today' }, { status: 404 });
  }

  const { data: attempts, error: attemptsError } = await supabase
    .from('attempts')
    .select('clues_used, total_time_ms, solved')
    .eq('game_id', game.id);

  if (attemptsError) {
    return Response.json({ error: 'Failed to load stats' }, { status: 500 });
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, failed: 0 };
  let totalSolvedTime = 0;
  let solvedCount = 0;

  for (const a of attempts ?? []) {
    if (a.solved) {
      distribution[a.clues_used]++;
      totalSolvedTime += a.total_time_ms;
      solvedCount++;
    } else {
      distribution.failed++;
    }
  }

  const totalPlayers = (attempts ?? []).length;
  const avgTimeMs = solvedCount > 0 ? Math.round(totalSolvedTime / solvedCount) : null;

  return Response.json({ totalPlayers, distribution, avgTimeMs });
}
