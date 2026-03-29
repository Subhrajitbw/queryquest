'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Database, Map, TerminalSquare, BarChart3, User, Flame, BrainCircuit } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const { xp, level, streak, checkStreak } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    checkStreak();
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, [checkStreak]);

  const navItems = [
    { name: 'Learning Hub', href: '/learning-hub', icon: BrainCircuit },
    { name: 'Playground', href: '/playground', icon: TerminalSquare },
    { name: 'Visualizers', href: '/visualizers', icon: BarChart3 },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const xpProgress = (xp % 1000) / 10; // percentage

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#070b14]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <Database className="h-6 w-6 text-blue-500" />
            <span>QueryQuest</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {mounted && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-orange-500">
              <Flame className="h-5 w-5" />
              <span className="font-bold">{streak}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 font-bold text-sm">
                {level}
              </div>
              <div className="w-32">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>XP</span>
                  <span>{xp % 1000} / 1000</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
