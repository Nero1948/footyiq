import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email || !EMAIL_REGEX.test(email)) {
    return new Response(errorPage('Invalid unsubscribe link.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    await supabase
      .from('email_subscribers')
      .delete()
      .eq('email', email.toLowerCase());
  } catch (err) {
    console.error('[unsubscribe] Error removing subscriber:', err);
    return new Response(errorPage('Something went wrong. Please try again.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new Response(successPage(), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

function successPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Unsubscribed — Set For Six</title>
</head>
<body style="margin:0;padding:60px 20px;background:#0a0e13;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;">
  <p style="font-size:20px;font-weight:900;margin:0 0 16px;">Set For Six &#127945;</p>
  <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;">You&rsquo;ve been unsubscribed</h1>
  <p style="font-size:15px;color:#9ca3af;margin:0 0 28px;">You won&rsquo;t receive any more emails from us.</p>
  <a href="https://www.setforsix.com"
     style="display:inline-block;background:#00e676;color:#000;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;">
    Back to the site
  </a>
</body>
</html>`;
}

function errorPage(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Error — Set For Six</title>
</head>
<body style="margin:0;padding:60px 20px;background:#0a0e13;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;">
  <p style="font-size:20px;font-weight:900;margin:0 0 16px;">Set For Six &#127945;</p>
  <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;color:#f87171;">Something went wrong</h1>
  <p style="font-size:15px;color:#9ca3af;margin:0 0 28px;">${message}</p>
  <a href="https://www.setforsix.com"
     style="display:inline-block;background:#00e676;color:#000;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;">
    Back to the site
  </a>
</body>
</html>`;
}
