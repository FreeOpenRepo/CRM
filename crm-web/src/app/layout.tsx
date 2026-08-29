import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Enterprise Sales Pipeline CRM Engine',
  description: 'Next.js 16 + .NET 10 MediatR 12 + SignalR Core Real-Time CRM Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
