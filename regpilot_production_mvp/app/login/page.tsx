'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setMessage('Signing in...');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.href = '/dashboard';
  }

  return (
    <div className="login-wrap">
      <section className="login-hero">
        <div className="logo"><div className="logo-mark">R</div><span>RegPilot</span></div>
        <div>
          <h1>Regulatory Manager access</h1>
          <p>Sign in to manage regulatory lines, control owners, deadlines, and email reminders.</p>
        </div>
        <p>No evidence uploads. Companies retain their supporting documents internally.</p>
      </section>
      <section className="login-panel">
        <form className="card login-card form" onSubmit={login}>
          <h2>Sign in</h2>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <button className="btn green" type="submit">Continue</button>
          {message && <div className="notice">{message}</div>}
        </form>
      </section>
    </div>
  );
}
