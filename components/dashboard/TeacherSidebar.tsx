'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
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
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-[#030712] px-5 py-6">
      <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-300">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-300">
                QueryQuest
              </div>
              <h2 className="mt-1 text-lg font-semibold text-white">Admin</h2>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-500"
            aria-label="Sidebar controls"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          QueryQuest Admin keeps classes, learners, and outcomes in one focused workspace.
        </p>
      </div>

      <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
        Workspace
      </div>

      <nav className="mt-3 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive(pathname);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'border-sky-500/25 bg-sky-500/10 text-white shadow-[0_18px_40px_rgba(14,165,233,0.12)]'
                  : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                  isActive
                    ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
                    : 'border-white/10 bg-white/[0.03] text-slate-500'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Profile
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white">
              QA
            </div>
            <div>
              <div className="font-medium text-white">QueryQuest Admin</div>
              <div className="text-sm text-slate-400">Teacher workspace</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-70"
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
