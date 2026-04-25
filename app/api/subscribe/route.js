import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { rateLimit, getIp } from '@/lib/rateLimit';
import { randomUUID } from 'crypto';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const ip = getIp(request);
  if (!rateLimit(`subscribe:${ip}`, 5, 60 * 60_000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { email } = body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return Response.json({ error: 'Invalid email' }, { status: 400 });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    let { error } = await supabase
      .from('email_subscribers')
      .insert({ email: cleanEmail, unsubscribe_token: randomUUID() });

    if (error?.code === 'PGRST204') {
      ({ error } = await supabase
        .from('email_subscribers')
        .insert({ email: cleanEmail }));
    }

    if (error) {
      // Postgres unique constraint violation — email already subscribed.
      // Return success to avoid leaking whether an address is in the list.
      if (error.code === '23505') {
        return Response.json({ success: true });
      }
      return Response.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
