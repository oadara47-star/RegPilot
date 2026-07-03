import nodemailer from 'nodemailer';

export type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
  fromEmail?: string | null;
  fromName?: string | null;
};

export async function sendMail(payload: MailPayload) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is missing.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const fromEmail = payload.fromEmail || process.env.DEFAULT_FROM_EMAIL || user;
  const fromName = payload.fromName || process.env.DEFAULT_FROM_NAME || 'RegPilot Compliance Desk';

  return transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}
