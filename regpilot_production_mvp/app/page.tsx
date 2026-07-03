import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="login-wrap">
      <section className="login-hero">
        <div className="logo"><div className="logo-mark">R</div><span>RegPilot</span></div>
        <div>
          <h1>Finance-first upstream compliance, without storing company evidence.</h1>
          <p>Track PIA/NUPRC, royalty, concession rental, tax, NCDMB, NDDC, NEITI, ECM, ERF, D&A and control owner deadlines from one regulatory manager dashboard.</p>
        </div>
        <p>Production MVP · Supabase · Vercel · Company SMTP reminders</p>
      </section>
      <section className="login-panel">
        <div className="card login-card grid">
          <h2>Ready for deployment</h2>
          <p>Regulatory Managers create users, assign regulatory lines, monitor due dates and send periodic company-email reminders.</p>
          <Link className="btn green" href="/login">Open Login</Link>
        </div>
      </section>
    </div>
  );
}
