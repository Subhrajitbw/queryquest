'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith('/dashboard');

  if (isDashboardRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </>
  );
}
