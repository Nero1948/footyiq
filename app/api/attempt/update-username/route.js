import { supabase } from '@/lib/supabase';
import { Filter } from 'bad-words';

const profanityFilter = new Filter();

export async function PATCH(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { deviceId, gameId, username } = body;

  if (!deviceId || typeof deviceId !== 'string') {
    return Response.json({ error: 'Missing or invalid deviceId' }, { status: 400 });
  }
  if (!gameId || typeof gameId !== 'string') {
    return Response.json({ error: 'Missing or invalid gameId' }, { status: 400 });
  }

  // ── Sanitise username ──────────────────────────────────────────────────────

  let cleanUsername = 'Anonymous';
  if (username && typeof username === 'string') {
    const trimmed = username.trim().slice(0, 20);
    if (trimmed) {
      cleanUsername = profanityFilter.isProfane(trimmed) ? 'Anonymous' : trimmed;
    }
  }

  // ── Update attempt ─────────────────────────────────────────────────────────

  const { data, error } = await supabase
    .from('attempts')
    .update({ username: cleanUsername })
    .eq('device_id', deviceId)
    .eq('game_id', gameId)
    .select('id, username');

  if (error) {
    return Response.json({ error: 'Failed to update username' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return Response.json({ error: 'No matching attempt found' }, { status: 404 });
  }

  return Response.json({ success: true, username: cleanUsername });
}
