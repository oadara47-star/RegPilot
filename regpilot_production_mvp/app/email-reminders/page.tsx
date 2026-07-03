'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { supabase } from '@/lib/supabaseClient';

export default function EmailRemindersPage() {
  const [settings, setSettings] = useState({ sender_name: 'RegPilot Compliance Desk', sender_email: '', weekly_day: 'Monday', weekly_time: '07:00', lookahead_days: 7, followup_frequency_days: 2, enabled: true });
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const { data: profileData } = await supabase.auth.getUser();
      if (!profileData.user) return;
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', profileData.user.id).single();
      if (!profile?.company_id) return;
      const { data } = await supabase.from('reminder_settings').select('*').eq('company_id', profile.company_id).maybeSingle();
      if (data) setSettings({ ...settings, ...data });
    }
    load();
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage('Saving...');
    const { data: profileData } = await supabase.auth.getUser();
    const user = profileData.user;
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    if (!profile?.company_id) return;
    const { error } = await supabase.from('reminder_settings').upsert({ company_id: profile.company_id, ...settings });
    setMessage(error ? error.message : 'Reminder settings saved. Cron will use these settings after deployment.');
  }

  return (
    <AppShell title="Email Reminders" subtitle="Use the company’s approved email address to remind control owners of due and overdue items.">
      <div className="grid grid-2">
        <form className="card form" onSubmit={save}>
          <h2>Reminder setup</h2>
          <div className="field"><label>Sender name</label><input value={settings.sender_name} onChange={(e) => setSettings({ ...settings, sender_name: e.target.value })} /></div>
          <div className="field"><label>Company sender email</label><input type="email" value={settings.sender_email} onChange={(e) => setSettings({ ...settings, sender_email: e.target.value })} placeholder="compliance@company.com" /></div>
          <div className="field"><label>Weekly reminder day</label><select value={settings.weekly_day} onChange={(e) => setSettings({ ...settings, weekly_day: e.target.value })}><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option></select></div>
          <div className="field"><label>Lookahead days</label><input type="number" value={settings.lookahead_days} onChange={(e) => setSettings({ ...settings, lookahead_days: Number(e.target.value) })} /></div>
          <div className="field"><label>Follow-up frequency for overdue items</label><input type="number" value={settings.followup_frequency_days} onChange={(e) => setSettings({ ...settings, followup_frequency_days: Number(e.target.value) })} /></div>
          <button className="btn green" type="submit">Save reminder settings</button>
          {message && <div className="notice">{message}</div>}
        </form>
        <div className="card grid">
          <h2>Production email requirements</h2>
          <div className="notice">The company must provide SMTP credentials or approve a Microsoft 365/Google Workspace integration. This MVP uses SMTP because it is the fastest production path.</div>
          <div className="notice">Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, DEFAULT_FROM_EMAIL and CRON_SECRET as Vercel environment variables.</div>
          <div className="notice">Vercel Cron calls <strong>/api/cron/send-reminders</strong> every Monday at 7:00 UTC by default. The schedule can be edited in <strong>vercel.json</strong>.</div>
        </div>
      </div>
    </AppShell>
  );
}
