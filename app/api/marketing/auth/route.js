export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { password } = body;
  const correct = process.env.MARKETING_PASSWORD ?? 'setforsix2026';

  if (password !== correct) {
    return Response.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const response = Response.json({ ok: true });
  response.headers.set(
    'Set-Cookie',
    'mkt_auth=1; Path=/marketing; HttpOnly; SameSite=Strict; Max-Age=2592000'
  );
  return response;
}
