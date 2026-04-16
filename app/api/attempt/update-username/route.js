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

  console.log('[update-username] received:', { deviceId: deviceId?.slice(-6), gameId, username });

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

  console.log('[update-username] clean username:', cleanUsername);

  // ── Update attempt ─────────────────────────────────────────────────────────

  const { data, error } = await supabase
    .from('attempts')
    .update({ username: cleanUsername })
    .eq('device_id', deviceId)
    .eq('game_id', gameId)
    .select('id, username');

  console.log('[update-username] supabase result:', { data, error });

  if (error) {
    console.error('[update-username] supabase error:', error);
    return Response.json({ error: 'Failed to update username' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    console.warn('[update-username] no rows matched — deviceId or gameId may be wrong');
    return Response.json({ error: 'No matching attempt found' }, { status: 404 });
  }

  console.log('[update-username] updated', data.length, 'row(s)');
  return Response.json({ success: true, username: cleanUsername });
}
