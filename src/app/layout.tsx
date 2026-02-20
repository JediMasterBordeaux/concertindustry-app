import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ConcertIndustry.com — AI Operations Assistant for Tour & Production Managers',
  description:
    'The professional AI assistant for Tour Managers, Production Managers, and Production Assistants. Budget tools, settlement helpers, crisis workflows, and operational knowledge for working touring professionals.',
  keywords: 'tour manager, production manager, touring, concert industry, settlement, budget, production assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
