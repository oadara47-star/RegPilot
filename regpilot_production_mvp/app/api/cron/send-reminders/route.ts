import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendMail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

type ReminderRow = {
  id: string;
  company_id: string;
  title: string;
  regulator: string;
  next_due_date: string;
  status: string;
  priority: string;
  due_day_rule: string;
  owner_id: string;
  profiles?: { email: string; full_name: string } | null;
};

function dueDateWindow(days: number) {
  const today = new Date();
  const target = new Date();
  target.setDate(today.getDate() + days);
  return { today: today.toISOString().slice(0, 10), target: target.toISOString().slice(0, 10) };
}

function buildEmail(ownerName: string, items: ReminderRow[]) {
  const rows = items.map((item) => {
    return `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><strong>${item.title}</strong><br/><span style="color:#667085;">${item.regulator}</span></td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${item.next_due_date}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${item.status.replace('_', ' ')}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${item.priority}</td></tr>`;
  }).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#132238;line-height:1.5;">
      <h2>Weekly RegPilot compliance reminder</h2>
      <p>Hello ${ownerName},</p>
      <p>These compliance items are due soon or overdue. Please update the status in RegPilot and keep all supporting documents in your company-approved internal location.</p>
      <table style="border-collapse:collapse;width:100%;border:1px solid #e5e7eb;">
        <thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:8px;">Obligation</th><th style="text-align:left;padding:8px;">Due date</th><th style="text-align:left;padding:8px;">Status</th><th style="text-align:left;padding:8px;">Priority</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:18px;color:#667085;">RegPilot does not require you to upload evidence. Retain schedules, receipts, approvals and filings internally.</p>
    </div>`;

  const text = `Hello ${ownerName},\n\nThese RegPilot compliance items are due soon or overdue:\n\n${items.map((i) => `- ${i.title} | ${i.regulator} | due ${i.next_due_date} | ${i.status}`).join('\n')}\n\nPlease update RegPilot and retain supporting documents internally.`;
  return { html, text };
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: settings, error: settingsError } = await supabase.from('reminder_settings').select('*').eq('enabled', true);
  if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 500 });

  let sent = 0;
  const errors: string[] = [];

  for (const setting of settings || []) {
    const { today, target } = dueDateWindow(setting.lookahead_days || 7);
    const { data: obligations, error } = await supabase
      .from('obligations')
      .select('id, company_id, title, regulator, next_due_date, status, priority, due_day_rule, owner_id, profiles:owner_id(email, full_name)')
      .eq('company_id', setting.company_id)
      .not('owner_id', 'is', null)
      .neq('status', 'completed')
      .or(`next_due_date.lt.${today},next_due_date.lte.${target}`) as { data: ReminderRow[] | null; error: { message: string } | null };

    if (error) {
      errors.push(error.message);
      continue;
    }

    const byOwner = new Map<string, ReminderRow[]>();
    for (const item of obligations || []) {
      const email = item.profiles?.email;
      if (!email) continue;
      byOwner.set(email, [...(byOwner.get(email) || []), item]);
    }

    for (const [email, items] of byOwner.entries()) {
      const ownerName = items[0].profiles?.full_name || 'Control Owner';
      const emailBody = buildEmail(ownerName, items);
      try {
        await sendMail({
          to: email,
          subject: `RegPilot: ${items.length} compliance item(s) due/overdue`,
          html: emailBody.html,
          text: emailBody.text,
          fromEmail: setting.sender_email,
          fromName: setting.sender_name,
        });
        sent += 1;
        await supabase.from('reminder_log').insert({ company_id: setting.company_id, recipient_email: email, subject: `RegPilot: ${items.length} compliance item(s) due/overdue`, item_count: items.length, status: 'sent' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Email failed';
        errors.push(`${email}: ${message}`);
        await supabase.from('reminder_log').insert({ company_id: setting.company_id, recipient_email: email, subject: 'RegPilot reminder failed', item_count: items.length, status: 'failed', error_message: message });
      }
    }
  }

  return NextResponse.json({ ok: true, sent, errors });
}
