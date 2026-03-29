'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Home,
  Loader2,
  LogOut,
  Users,
} from 'lucide-react';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    isActive: (pathname: string) => pathname === '/dashboard',
  },
  {
    label: 'Students',
    href: '/dashboard/students',
    icon: Users,
    isActive: (pathname: string) =>
      pathname === '/dashboard/students' || pathname.startsWith('/dashboard/student/'),
  },
  {
    label: 'Classes',
    href: '/dashboard/class',
    icon: BookOpen,
    isActive: (pathname: string) =>
      pathname === '/dashboard/class' || pathname.startsWith('/dashboard/class/'),
  },
  {
    label: 'Analytics',
    href: '/dashboard/overview',
    icon: BarChart3,
    isActive: (pathname: string) => pathname === '/dashboard/overview',
  },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#070b14] px-4 py-6">
      <div className="mb-8 px-2">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
          QueryQuest
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
          Teacher Panel
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Manage classes, review learners, and monitor progress.
        </p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive(pathname);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? 'border-blue-500/40 bg-blue-500/15 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.12)]'
                  : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Access
          </div>
          <div className="mt-2 text-sm font-semibold text-white">Admin View</div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition-all hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
