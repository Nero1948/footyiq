import { supabase } from '@/lib/supabase';
import { sendDailyEmail } from '@/lib/sendDailyEmail';

export async function GET(request) {
  // ── Auth ───────────────────────────────────────────────────────────────────

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // ── Run ────────────────────────────────────────────────────────────────────

  try {
    const todayAEST = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Australia/Sydney',
    });

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, game_number')
      .eq('date', todayAEST)
      .single();

    if (gameError || !game) {
      console.warn(`[send-emails] No game found for ${todayAEST} — skipping emails`);
      return Response.json({ success: true, date: todayAEST, emails: { sent: 0, failed: 0 } });
    }

    const emails = await sendDailyEmail(game.game_number);
    console.log(`[send-emails] Game #${game.game_number} — sent: ${emails.sent}, failed: ${emails.failed}`);

    return Response.json({ success: true, date: todayAEST, gameNumber: game.game_number, emails });
  } catch (err) {
    console.error('[send-emails] Unexpected error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
