import { cookies } from 'next/headers';
import { rateLimit, getIp } from '@/lib/rateLimit';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { password } = body;
  const ip = getIp(request);
  if (!rateLimit(`marketing-auth:${ip}`, 5, 15 * 60_000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  const correct = process.env.MARKETING_PASSWORD?.trim();

  if (!correct) {
    return Response.json({ error: 'Marketing password is not configured' }, { status: 503 });
  }

  if (typeof password !== 'string' || password.trim() !== correct) {
    return Response.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set('mkt_auth', '1', {
    path: '/marketing',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  });

  return Response.json({ ok: true });
}
