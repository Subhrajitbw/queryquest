import type { Metadata } from 'next';
import './globals.css';
import LevelUpModal from '@/components/LevelUpModal';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'QueryQuest',
  description: 'An interactive SQL learning platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#070b14] text-white antialiased selection:bg-blue-500/30">
        <AppShell>{children}</AppShell>
        <LevelUpModal />
      </body>
    </html>
  );
}
