import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { rateLimit, getIp } from '@/lib/rateLimit';

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { gameId, deviceId, clueNumber, totalTimeMs } = body;

  const ip = getIp(request);
  if (!rateLimit(`clue:${ip}`, 30, 60_000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  if (!gameId || typeof gameId !== 'string') {
    return Response.json({ error: 'Missing or invalid gameId' }, { status: 400 });
  }
  if (!deviceId || typeof deviceId !== 'string') {
    return Response.json({ error: 'Missing or invalid deviceId' }, { status: 400 });
  }
  if (!Number.isInteger(clueNumber) || clueNumber < 1 || clueNumber >= 6) {
    return Response.json({ error: 'clueNumber must be an integer between 1 and 5' }, { status: 400 });
  }
  if (typeof totalTimeMs !== 'number' || totalTimeMs < 0) {
    return Response.json({ error: 'Invalid elapsed time' }, { status: 400 });
  }

  let game, dbError;

  try {
    ({ data: game, error: dbError } = await supabase
      .from('games')
      .select(`clue_${clueNumber + 1}`)
      .eq('id', gameId)
      .single());
  } catch {
    return Response.json({ error: 'Failed to query database' }, { status: 500 });
  }

  if (dbError) {
    if (dbError.code === 'PGRST116') {
      return Response.json({ error: 'Game not found' }, { status: 404 });
    }
    return Response.json({ error: 'Failed to load clue' }, { status: 500 });
  }

  return Response.json({ nextClue: game[`clue_${clueNumber + 1}`] });
}
