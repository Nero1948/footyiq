import { supabase } from '@/lib/supabase';
import Filter from 'bad-words';

const profanityFilter = new Filter();

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { gameId, deviceId, cluesUsed, totalTimeMs, guesses, solved, username } = body;

  // ── Input validation ───────────────────────────────────────────────────────

  if (!gameId || typeof gameId !== 'string') {
    return Response.json({ error: 'Missing or invalid gameId' }, { status: 400 });
  }
  if (!deviceId || typeof deviceId !== 'string') {
    return Response.json({ error: 'Missing or invalid deviceId' }, { status: 400 });
  }
  if (!Number.isInteger(cluesUsed) || cluesUsed < 1 || cluesUsed > 6) {
    return Response.json({ error: 'cluesUsed must be an integer between 1 and 6' }, { status: 400 });
  }
  if (typeof totalTimeMs !== 'number' || !Number.isFinite(totalTimeMs)) {
    return Response.json({ error: 'Missing or invalid totalTimeMs' }, { status: 400 });
  }
  if (!Array.isArray(guesses)) {
    return Response.json({ error: 'guesses must be an array' }, { status: 400 });
  }
  if (typeof solved !== 'boolean') {
    return Response.json({ error: 'solved must be a boolean' }, { status: 400 });
  }

  // ── Sanitise username ──────────────────────────────────────────────────────

  let cleanUsername = 'Anonymous';
  if (username && typeof username === 'string') {
    const trimmed = username.trim().slice(0, 20);
    if (trimmed) {
      cleanUsername = profanityFilter.isProfane(trimmed) ? 'Anonymous' : trimmed;
    }
  }

  // ── Anti-cheat ─────────────────────────────────────────────────────────────

  if (totalTimeMs < 500) {
    return Response.json({ error: 'Invalid submission time' }, { status: 400 });
  }

  try {
    // ── Verify game exists ───────────────────────────────────────────────────

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('id', gameId)
      .single();

    if (gameError) {
      if (gameError.code === 'PGRST116') {
        return Response.json({ error: 'Game not found' }, { status: 404 });
      }
      return Response.json({ error: 'Failed to verify game' }, { status: 500 });
    }

    // ── Duplicate submission check ───────────────────────────────────────────

    const { data: existingAttempt, error: duplicateError } = await supabase
      .from('attempts')
      .select('id')
      .eq('game_id', gameId)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (duplicateError) {
      return Response.json({ error: 'Failed to check submission status' }, { status: 500 });
    }
    if (existingAttempt) {
      return Response.json({ error: 'Already submitted' }, { status: 409 });
    }

    // ── Insert attempt ───────────────────────────────────────────────────────

    const { error: insertError } = await supabase
      .from('attempts')
      .insert({
        game_id: gameId,
        device_id: deviceId,
        clues_used: cluesUsed,
        total_time_ms: totalTimeMs,
        guesses,
        solved,
        username: cleanUsername,
      });

    if (insertError) {
      return Response.json({ error: 'Failed to save attempt' }, { status: 500 });
    }

    // ── Calculate rank ───────────────────────────────────────────────────────
    // Rank = number of attempts that beat this submission + 1.
    // An attempt beats this one if:
    //   - it used fewer clues, OR
    //   - it used the same clues but was faster

    const { count: rankCount, error: rankError } = await supabase
      .from('attempts')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .or(
        `clues_used.lt.${cluesUsed},` +
        `and(clues_used.eq.${cluesUsed},total_time_ms.lt.${totalTimeMs})`
      );

    if (rankError) {
      return Response.json({ error: 'Failed to calculate rank' }, { status: 500 });
    }

    const rank = rankCount + 1;

    // ── Count total players ──────────────────────────────────────────────────

    const { count: totalPlayers, error: countError } = await supabase
      .from('attempts')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', gameId);

    if (countError) {
      return Response.json({ error: 'Failed to count players' }, { status: 500 });
    }

    // ── Percentile ───────────────────────────────────────────────────────────
    // 100th percentile = best (rank 1). Rounded to nearest integer.

    const percentile = Math.round(((totalPlayers - rank + 1) / totalPlayers) * 100);

    return Response.json({ success: true, rank, totalPlayers, percentile });

  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
