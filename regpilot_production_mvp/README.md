# RegPilot Production MVP v0.4

RegPilot is a finance-first upstream compliance and email reminder platform for Nigerian E&P companies.

This production MVP includes:

- Regulatory Manager as the highest-access user.
- User creation and regulatory line assignment.
- Role-based access model for control owners, department managers and viewers.
- Compliance obligation dashboard.
- Formulaized but optional computation fields.
- No evidence/file uploads. Companies retain all evidence internally.
- Company email reminder setup using SMTP.
- Vercel Cron route for weekly reminders.
- Supabase Postgres schema and seed template.

## Technology stack

- Next.js App Router
- Supabase Auth + Postgres
- Supabase Row Level Security
- Nodemailer SMTP
- Vercel hosting and cron jobs

## Deployment steps

### 1. Create Supabase project

Create a new Supabase project and copy:

- Project URL
- Public anon key
- Service role key

### 2. Run database schema

Open Supabase SQL Editor and run:

```sql
-- paste database/schema.sql
```

### 3. Create first Regulatory Manager auth user

In Supabase Dashboard:

1. Go to Authentication > Users.
2. Add user manually.
3. Set email and password.
4. Copy the new Auth User ID.

### 4. Seed company, lines and obligations

Open `database/seed_template.sql`.

Replace:

- `{{COMPANY_NAME}}`
- `{{REGULATORY_MANAGER_AUTH_USER_ID}}`
- `{{REGULATORY_MANAGER_EMAIL}}`
- `{{REGULATORY_MANAGER_FULL_NAME}}`

Run the first company insert, copy the returned company ID, then replace `{{COMPANY_ID}}` and run the remaining seed script.

### 5. Configure environment variables

Create `.env.local` for local development and add the same variables to Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
DEFAULT_FROM_EMAIL=
DEFAULT_FROM_NAME=RegPilot Compliance Desk
NEXT_PUBLIC_APP_URL=
```

For Microsoft 365 SMTP, a common host is `smtp.office365.com` and port `587`, but the company admin must approve SMTP AUTH/app password or provide the correct corporate SMTP relay.

### 6. Deploy to Vercel

Recommended:

1. Push this folder to GitHub.
2. Import the GitHub repository into Vercel.
3. Add environment variables in Vercel Project Settings.
4. Deploy to Production.

Alternative CLI:

```bash
npm install
npm run build
npx vercel --prod
```

### 7. Cron reminder route

Vercel will read `vercel.json` and call this route weekly:

```text
/api/cron/send-reminders
```

Default schedule:

```text
0 7 * * 1
```

That means Monday at 7:00 UTC.

If `CRON_SECRET` is set in Vercel, Vercel sends it as a Bearer token in the Authorization header. The route checks this before sending reminders.

## Production notes

- Do not store evidence files in RegPilot.
- Supporting documents are listed as internal-retention checklists only.
- Computation is optional; formulas guide users without forcing sensitive data entry.
- The production app requires company-approved SMTP or email-provider integration.
- For enterprise-grade deployment, add audit logs, SSO, tenant onboarding, billing and notification preferences.

## MVP compliance lines included

- PAYE
- VAT
- WHT
- CIT / Hydrocarbon Tax
- Monthly Royalty
- Concession Rental
- NUPRC Fees & Charges
- Monthly Production Reporting
- Advance Cargo Declaration
- Domestic Crude Oil Supply Obligation
- Domestic Gas Delivery Obligation
- ECM Monthly Report
- Environmental Remediation Fund
- Gas Flaring, Venting & Methane
- Safety & Incident Compliance
- Decommissioning & Abandonment
- Host Community Development Trust
- NCDF / NCDMB Levy & Content Compliance
- NDDC Levy
- NEITI Reporting & Reconciliation
- Licence & Acreage Governance
- FDP / Work Programme / Drilling Approvals
- Assignment of Interest / Change of Control
- Financial Reporting, CAC, FRC & Audit
- Regulatory Correspondence & Action Tracker
