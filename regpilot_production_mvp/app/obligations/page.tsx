'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from '@/lib/format';
import type { Obligation } from '@/lib/types';

export default function ObligationsPage() {
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('obligations').select('*').order('next_due_date', { ascending: true });
    setObligations((data || []) as Obligation[]);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    await supabase.from('obligations').update({ status }).eq('id', id);
    await load();
    setSavingId(null);
  }

  return (
    <AppShell title="Obligations" subtitle="Track status, formula logic, due dates and internally retained documents without storing evidence files.">
      <div className="card">
        <table className="table">
          <thead><tr><th>Line item</th><th>Due rule</th><th>Next due</th><th>Formula / optional computation</th><th>Internal documents to retain</th><th>Status</th></tr></thead>
          <tbody>
            {obligations.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.title}</strong><br /><small>{item.regulator} · {item.priority}</small></td>
                <td>{item.due_day_rule}</td>
                <td>{formatDate(item.next_due_date)}</td>
                <td>{item.formula ? <><strong>{item.formula}</strong><br /><small>Computation optional</small></> : <small>No in-app computation required</small>}</td>
                <td><small>{(item.internal_documents_to_retain || []).join(', ') || 'Internal support retained by company'}</small></td>
                <td>
                  <select value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)} disabled={savingId === item.id}>
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="awaiting_review">Awaiting review</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                    <option value="not_applicable">Not applicable</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
