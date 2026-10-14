// Server-only helpers: lead email notifications (Resend) + automatic lead escalation.
// Email is best-effort — it must never block or fail saving an enquiry.

const esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const splitEmails = (v) => String(v || '').split(/[,;\s]+/).map(x => x.trim()).filter(x => /.+@.+\..+/.test(x));

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

export function leadRecipients(settings) {
  const list = splitEmails(settings?.notifications?.leadEmails);
  if (list.length) return list;
  return splitEmails(process.env.LEAD_NOTIFY_EMAIL || settings?.email);
}

export function escalationRecipients(settings) {
  const list = splitEmails(settings?.leadOverflow?.managerEmail);
  return list.length ? list : leadRecipients(settings);
}

export async function sendEmail({ to, subject, html, replyTo, idempotencyKey }) {
  if (!process.env.RESEND_API_KEY) return { skipped: 'RESEND_API_KEY not set' };
  if (!to || to.length === 0) return { skipped: 'no recipients' };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey.slice(0, 256) } : {}),
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Gillco Leads <onboarding@resend.dev>',
        to,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function leadHtml(e, heading, note) {
  const row = (k, v) => (v ? `<tr><td style="padding:6px 12px;color:#64748b;font-size:13px">${k}</td><td style="padding:6px 12px;font-size:14px;color:#0f172a"><b>${esc(v)}</b></td></tr>` : '');
  const phoneDigits = String(e.phone || '').replace(/\D/g, '');
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
  <div style="background:#0b4d3b;color:#fff;padding:16px 20px"><div style="font-size:12px;letter-spacing:2px;color:#d9a943">GILLCO GROUP</div><div style="font-size:20px;margin-top:4px">${esc(heading)}</div></div>
  ${note ? `<div style="background:#fef2f2;color:#991b1b;padding:10px 20px;font-size:13px">${esc(note)}</div>` : ''}
  <table style="width:100%;border-collapse:collapse;margin:8px 0">
    ${row('Name', e.name)}${row('Phone', e.phone)}${row('Email', e.email)}${row('Project', e.projectName)}${row('Property type', e.propertyType)}${row('Budget', e.budget)}
    ${row('Enquiry type', e.type)}${row('Routed to', e.routedTo)}${row('Source', e.utm?.utm_source || 'website')}
    ${row('Received', new Date(e.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))}
  </table>
  ${e.message ? `<div style="padding:0 20px 12px;font-size:14px;color:#334155"><div style="color:#64748b;font-size:13px">Message</div>${esc(e.message).replace(/\n/g, '<br>')}</div>` : ''}
  ${phoneDigits ? `<div style="padding:12px 20px 20px"><a href="tel:+${phoneDigits}" style="background:#0b4d3b;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:14px">Call now</a> &nbsp; <a href="https://wa.me/${phoneDigits}" style="background:#25d366;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:14px">WhatsApp</a></div>` : ''}
</div>`;
}

export async function notifyNewLead(db, lead) {
  try {
    const settings = await db.collection('settings').findOne({ id: 'site' });
    if (settings?.notifications?.emailEnabled === false) return;
    const r = await sendEmail({
      to: leadRecipients(settings),
      subject: `New enquiry: ${lead.name} — ${lead.projectName || 'General'}`,
      html: leadHtml(lead, 'New website enquiry'),
      replyTo: lead.email || undefined,
      idempotencyKey: `lead-new-${lead.id}`,
    });
    if (r && !r.skipped) {
      await db.collection('enquiries').updateOne({ id: lead.id }, { $set: { adminNotifiedAt: new Date().toISOString() } });
    }
  } catch (err) {
    console.error('[lead-email] new lead notification failed', lead?.id, err?.message);
  }
}

// Finds unclaimed leads older than the configured window, marks them escalated and emails the manager.
// Only auto-escalates when email is configured, so nothing is silently hidden from the "Overdue" list.
export async function runEscalation(db) {
  const settings = await db.collection('settings').findOne({ id: 'site' });
  const ov = settings?.leadOverflow || {};
  if (ov.enabled === false) return { checked: 0, escalated: 0, skipped: 'overflow disabled' };
  if (!emailConfigured()) return { checked: 0, escalated: 0, skipped: 'email not configured' };
  const to = escalationRecipients(settings);
  if (to.length === 0) return { checked: 0, escalated: 0, skipped: 'no manager email' };

  const minutes = Number(ov.minutes) > 0 ? Number(ov.minutes) : 15;
  const cutoff = new Date(Date.now() - minutes * 60000).toISOString();
  const leads = await db.collection('enquiries')
    .find({ claimed: { $ne: true }, escalated: { $ne: true }, createdAt: { $lte: cutoff } })
    .sort({ createdAt: 1 }).limit(25).toArray();

  let escalated = 0;
  for (const lead of leads) {
    const now = new Date().toISOString();
    // Atomic lock so overlapping runs never send duplicates
    const lock = await db.collection('enquiries').updateOne(
      { id: lead.id, claimed: { $ne: true }, escalated: { $ne: true } },
      { $set: { escalated: true, escalatedAt: now, escalatedBy: 'auto' } }
    );
    if (lock.modifiedCount !== 1) continue;
    try {
      await sendEmail({
        to,
        subject: `⚠ Unclaimed lead for ${minutes}+ min: ${lead.name} — ${lead.projectName || 'General'}`,
        html: leadHtml(lead, 'Lead escalation', `No one has claimed this lead for more than ${minutes} minutes. Please call the customer now.`),
        replyTo: lead.email || undefined,
        idempotencyKey: `lead-escalate-${lead.id}`,
      });
      escalated++;
    } catch (err) {
      console.error('[lead-email] escalation failed', lead.id, err?.message);
      // roll back so the next run retries
      await db.collection('enquiries').updateOne({ id: lead.id }, { $set: { escalated: false, escalatedAt: null, escalatedBy: null } });
    }
  }
  return { checked: leads.length, escalated, minutes };
}
