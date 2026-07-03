'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/lib/types';

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        window.location.href = '/login';
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data as Profile);
    }
    loadProfile();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo"><div className="logo-mark">R</div><span>RegPilot</span></div>
        <nav className="nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/obligations">Obligations</Link>
          <Link href="/lines">Regulatory Lines</Link>
          <Link href="/users">Users & Access</Link>
          <Link href="/email-reminders">Email Reminders</Link>
        </nav>
        <div className="sidebar-note">
          Finance-first upstream compliance for Nigerian E&P companies. No evidence files are stored in this MVP.
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {profile && <span className="badge green">{profile.role.replace('_', ' ')}</span>}
            <button className="btn secondary" onClick={signOut}>Sign out</button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
