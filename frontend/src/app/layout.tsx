import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Swiss Airlines Support Agent',
  description: 'AI-powered customer support for Swiss Airlines',
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


