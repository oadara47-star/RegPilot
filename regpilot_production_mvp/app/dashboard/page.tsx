'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { supabase } from '@/lib/supabaseClient';
import { daysUntil, formatDate } from '@/lib/format';
import type { Obligation } from '@/lib/types';

export default function DashboardPage() {
  const [obligations, setObligations] = useState<Obligation[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('obligations')
        .select('*')
        .order('next_due_date', { ascending: true });
      setObligations((data || []) as Obligation[]);
    }
    load();
  }, []);

  const total = obligations.length;
  const completed = obligations.filter((o) => o.status === 'completed').length;
  const overdue = obligations.filter((o) => o.status === 'overdue' || (daysUntil(o.next_due_date) ?? 99) < 0).length;
  const dueSoon = obligations.filter((o) => {
    const d = daysUntil(o.next_due_date);
    return d !== null && d >= 0 && d <= 7 && o.status !== 'completed';
  }).length;
  const highRisk = obligations.filter((o) => ['high', 'critical'].includes(o.priority)).length;
  const score = total ? Math.round((completed / total) * 100) : 0;

  return (
    <AppShell title="Compliance Command Centre" subtitle="Regulatory Manager view across fiscal, tax, NUPRC and operational compliance lines.">
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card kpi"><span>Compliance Score</span><strong>{score}%</strong><span>Completed / total obligations</span></div>
        <div className="card kpi"><span>Due within 7 days</span><strong>{dueSoon}</strong><span>Control owner follow-up required</span></div>
        <div className="card kpi"><span>Overdue</span><strong>{overdue}</strong><span>Escalate immediately</span></div>
        <div className="card kpi"><span>High-risk lines</span><strong>{highRisk}</strong><span>Finance and regulator-sensitive</span></div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>Priority obligations</h2>
          <table className="table">
            <thead><tr><th>Obligation</th><th>Regulator</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              {obligations.slice(0, 8).map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.title}</strong><br /><small>{item.frequency}</small></td>
                  <td>{item.regulator}</td>
                  <td>{formatDate(item.next_due_date)}</td>
                  <td><span className={`status ${item.status}`}>{item.status.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card grid">
          <h2>Product guardrails</h2>
          <div className="notice"><strong>No evidence upload:</strong> RegPilot does not store receipts, invoices, payment schedules, regulator letters or board approvals. Each obligation only shows what the company should retain internally.</div>
          <div className="notice"><strong>Optional computation:</strong> Formulas are shown clearly, but users may skip inputting sensitive values and simply mark the control status.</div>
          <div className="notice"><strong>Company email reminders:</strong> Weekly follow-up emails are sent through the company’s approved SMTP/mailbox configuration.</div>
        </div>
      </div>
    </AppShell>
  );
}
