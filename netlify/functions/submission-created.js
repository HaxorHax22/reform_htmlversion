// Netlify Event Function: triggers after a successful form submission
// Docs: https://docs.netlify.com/functions/trigger-on-events/

exports.handler = async (event) => {
  try {
    const submission = JSON.parse(event.body || '{}');
    const formName = submission?.payload?.data?.form_name || submission?.payload?.form_name || submission?.form_name || 'contact';
    const data = submission?.payload?.data || submission?.data || {};

    const submitterName = data.name || data.Nafn || 'Ónefnt';
    const submitterEmail = data.email || data.Netfang || data.reply_to || '';
    const message = data.message || data.Skilaboð || '';
    const redirect = data.redirect || '/thank-you.html';

    const toEmail = process.env.CONTACT_TO_EMAIL || 'hello@reform.is';
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'; // Replace after domain verification
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not set; skipping email send.');
      return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
    }

    const subject = `Ný innsending á ${formName} – ${submitterName}`;

    const html = `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Inter, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#f8fafc; padding:24px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.06); overflow:hidden;">
              <tr>
                <td style="background:#0ea5e9; color:#ffffff; padding:20px 24px; font-size:18px; font-weight:700;">REFORM – Ný skilaboð</td>
              </tr>
              <tr>
                <td style="padding:24px; color:#0f172a;">
                  <p style="margin:0 0 12px; font-size:16px;"><strong>Form:</strong> ${formName}</p>
                  <p style="margin:0 0 8px; font-size:16px;"><strong>Nafn:</strong> ${escapeHtml(submitterName)}</p>
                  <p style="margin:0 0 8px; font-size:16px;"><strong>Netfang:</strong> ${escapeHtml(submitterEmail)}</p>
                  <div style="margin:16px 0;">
                    <div style="font-size:16px; font-weight:600; margin-bottom:8px;">Skilaboð:</div>
                    <div style="white-space:pre-wrap; background:#f1f5f9; padding:12px; border-radius:8px; font-size:15px;">${escapeHtml(message)}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px; color:#475569; font-size:12px; border-top:1px solid #e2e8f0;">
                  Sent sjálfvirkt af Netlify Forms · Reply-To verður sett á innsendingar netfang
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

    const payload = {
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
      reply_to: submitterEmail || undefined,
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Resend error:', text);
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Email send failed' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, redirect }),
    };
  } catch (err) {
    console.error('submission-created handler error', err);
    return { statusCode: 500, body: JSON.stringify({ ok: false }) };
  }
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


