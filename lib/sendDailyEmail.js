import { Resend } from 'resend';
import { supabaseAdmin } from './supabaseAdmin';

const SITE_URL = 'https://www.setforsix.com';
const FROM = 'Set For Six <game@setforsix.com>';

// Resend batch endpoint accepts up to 100 messages per call
const BATCH_SIZE = 100;

function buildHtml(gameNumber, email) {
  const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Set For Six #${gameNumber} is ready \u{1F3C9}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0e13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#0a0e13;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;width:100%;">

          <!-- Wordmark -->
          <tr>
            <td style="padding-bottom:28px;">
              <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:-0.3px;color:#ffffff;">Set For Six &#127945;</p>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#111827;border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:36px 32px;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">Game #${gameNumber}</p>
              <h1 style="margin:0 0 14px;font-size:26px;font-weight:900;line-height:1.25;color:#ffffff;">Today&rsquo;s mystery NRL player is waiting.</h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#9ca3af;">Six clues. One player. Can you crack it before your mates do?</p>
              <a href="${SITE_URL}/play"
                 style="display:inline-block;background-color:#00e676;color:#000000;font-size:16px;font-weight:900;text-decoration:none;padding:14px 32px;border-radius:12px;letter-spacing:0.04em;">
                Play Now &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.7;color:#374151;">
                You signed up for daily reminders at setforsix.com<br />
                <a href="${unsubUrl}" style="color:#4b5563;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Fetches all subscribers and sends each one a "game is ready" email.
 *
 * @param {number} gameNumber
 * @returns {{ sent: number, failed: number }}
 */
export async function sendDailyEmail(gameNumber) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[sendDailyEmail] RESEND_API_KEY not set — skipping');
    return { sent: 0, failed: 0 };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const subject = `Set For Six #${gameNumber} is ready 🏉`;

  // Fetch all subscriber emails (row is deleted on unsubscribe, so all rows are active)
  const { data: subscribers, error } = await supabaseAdmin
    .from('email_subscribers')
    .select('email');

  if (error) {
    console.error('[sendDailyEmail] Failed to fetch subscribers:', error.message);
    return { sent: 0, failed: 0, error: error.message };
  }

  if (!subscribers?.length) {
    console.log('[sendDailyEmail] No subscribers — nothing to send');
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  // Send in batches to stay within Resend's 100-message-per-call limit
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const chunk = subscribers.slice(i, i + BATCH_SIZE);
    const messages = chunk.map(({ email }) => ({
      from: FROM,
      to: email,
      subject,
      html: buildHtml(gameNumber, email),
    }));

    try {
      const { error: batchError } = await resend.batch.send(messages);
      if (batchError) {
        console.error(`[sendDailyEmail] Batch error (chunk ${i}–${i + chunk.length}):`, batchError);
        failed += chunk.length;
      } else {
        sent += chunk.length;
      }
    } catch (err) {
      console.error(`[sendDailyEmail] Batch threw (chunk ${i}–${i + chunk.length}):`, err);
      failed += chunk.length;
    }
  }

  console.log(`[sendDailyEmail] Finished — sent: ${sent}, failed: ${failed}`);
  return { sent, failed };
}
