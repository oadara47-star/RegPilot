'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { supabase } from '@/lib/supabaseClient';
import type { Profile, RegulatoryLine } from '@/lib/types';

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [lines, setLines] = useState<RegulatoryLine[]>([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'control_owner', department: '', lineIds: [] as string[] });

  async function load() {
    const [{ data: userData }, { data: lineData }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('regulatory_lines').select('*').order('name'),
    ]);
    setUsers((userData || []) as Profile[]);
    setLines((lineData || []) as RegulatoryLine[]);
  }

  useEffect(() => { load(); }, []);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setMessage('Creating user...');
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || 'Unable to create user.');
      return;
    }
    setMessage('User created and regulatory lines assigned.');
    setForm({ fullName: '', email: '', password: '', role: 'control_owner', department: '', lineIds: [] });
    await load();
  }

  function toggleLine(id: string) {
    setForm((current) => ({
      ...current,
      lineIds: current.lineIds.includes(id) ? current.lineIds.filter((x) => x !== id) : [...current.lineIds, id],
    }));
  }

  return (
    <AppShell title="Users & Access" subtitle="Regulatory Manager creates users and assigns only the regulatory lines they should see/action.">
      <div className="grid grid-2">
        <form className="card form" onSubmit={createUser}>
          <h2>Create control owner</h2>
          <div className="field"><label>Full name</label><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div className="field"><label>Temporary password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
          <div className="field"><label>Role</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="control_owner">Control Owner</option><option value="department_manager">Department Manager</option><option value="viewer">Viewer</option><option value="regulatory_manager">Regulatory Manager</option></select></div>
          <div className="field"><label>Department</label><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Finance, HSSE, Legal, Operations" /></div>
          <div className="field"><label>Regulatory lines</label><div className="grid" style={{ maxHeight: 220, overflow: 'auto' }}>{lines.map((line) => <label key={line.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={form.lineIds.includes(line.id)} onChange={() => toggleLine(line.id)} /> {line.name}</label>)}</div></div>
          <button className="btn green" type="submit">Create user</button>
          {message && <div className="notice">{message}</div>}
        </form>

        <div className="card">
          <h2>Current users</h2>
          <table className="table">
            <thead><tr><th>Name</th><th>Role</th><th>Department</th></tr></thead>
            <tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.full_name}</strong><br /><small>{user.email}</small></td><td>{user.role.replace('_', ' ')}</td><td>{user.department || '—'}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
