import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RegPilot',
  description: 'Finance-first upstream compliance and reminder platform for Nigerian E&P companies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
