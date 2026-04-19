import { cookies } from 'next/headers';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { password } = body;
  const correct = (process.env.MARKETING_PASSWORD ?? 'setforsix2026').trim();

  if (password.trim() !== correct) {
    return Response.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set('mkt_auth', '1', {
    path: '/marketing',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30,
  });

  return Response.json({ ok: true });
}
