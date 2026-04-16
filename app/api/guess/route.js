import { supabase } from '@/lib/supabase';
import { matchAnswer } from '@/lib/matchAnswer';

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { gameId, deviceId, guess, clueNumber, totalTimeMs } = body;

  // ── Input validation ───────────────────────────────────────────────────────

  if (!gameId || typeof gameId !== 'string') {
    return Response.json({ error: 'Missing or invalid gameId' }, { status: 400 });
  }
  if (!deviceId || typeof deviceId !== 'string') {
    return Response.json({ error: 'Missing or invalid deviceId' }, { status: 400 });
  }
  if (!guess || typeof guess !== 'string' || guess.trim() === '') {
    return Response.json({ error: 'Missing or invalid guess' }, { status: 400 });
  }
  if (!Number.isInteger(clueNumber) || clueNumber < 1 || clueNumber > 6) {
    return Response.json({ error: 'clueNumber must be an integer between 1 and 6' }, { status: 400 });
  }

  // ── Anti-cheat ─────────────────────────────────────────────────────────────

  if (typeof totalTimeMs !== 'number' || totalTimeMs < 500) {
    return Response.json({ error: 'Invalid submission time' }, { status: 400 });
  }

  // ── Fetch game (answer stays server-side) ──────────────────────────────────

  let game, dbError;

  try {
    ({ data: game, error: dbError } = await supabase
      .from('games')
      .select('id, answer_player, clue_1, clue_2, clue_3, clue_4, clue_5, clue_6, facts')
      .eq('id', gameId)
      .single());
  } catch (err) {
    return Response.json({ error: 'Failed to query database' }, { status: 500 });
  }

  if (dbError) {
    if (dbError.code === 'PGRST116') {
      return Response.json({ error: 'Game not found' }, { status: 404 });
    }
    return Response.json({ error: 'Failed to load game' }, { status: 500 });
  }

  // ── Check guess ────────────────────────────────────────────────────────────

  const { matched } = matchAnswer(guess, game.answer_player);

  if (matched) {
    return Response.json({
      correct: true,
      answer: game.answer_player,
      facts: game.facts ?? [],
    });
  }

  // Wrong guess — either reveal next clue or end the game
  if (clueNumber < 6) {
    const nextClue = game[`clue_${clueNumber + 1}`];
    return Response.json({
      correct: false,
      nextClue,
    });
  }

  // clueNumber === 6 and still wrong — game over
  return Response.json({
    correct: false,
    failed: true,
    answer: game.answer_player,
    facts: game.facts ?? [],
  });
}
