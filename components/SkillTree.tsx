'use client';

import { useAppStore } from '@/lib/store';
import {
  CheckCircle2,
  Lock,
  Star,
  Play,
  Loader2,
  ArrowRight,
  Orbit,
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { generateMapChapters, Chapter } from '@/lib/aiEngine';

function getStageLabel(index: number) {
  if (index < 5) return 'Foundations';
  if (index < 10) return 'Query Craft';
  if (index < 15) return 'Data Modeling';
  if (index < 20) return 'Internals';
  return 'Systems Thinking';
}

export default function SkillTree({ onChapterClick }: { onChapterClick?: (chapter: Chapter) => void }) {
  const { completedChapters } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChapters = async () => {
      try {
        const data = await generateMapChapters();
        setChapters(data);
      } catch (err) {
        console.error('Failed to load chapters:', err);
      } finally {
        setIsLoading(false);
        setMounted(true);
      }
    };
    loadChapters();
  }, []);

  const currentIndex = useMemo(() => {
    if (!chapters.length) return 0;
    const next = chapters.findIndex((chapter) => !completedChapters.includes(chapter.id));
    return next === -1 ? chapters.length - 1 : next;
  }, [chapters, completedChapters]);

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-gray-400 animate-pulse">Mapping your curriculum...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
              Progress Snapshot
            </div>
            <div className="mt-2 text-lg font-bold text-white">
              {completedChapters.length} chapters completed
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              Move in order so each chapter builds the intuition needed for the next one.
            </p>
          </div>
          <div className="min-w-[260px] flex-1 lg:max-w-md">
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-zinc-500">
              <span>Overall Path</span>
              <span>{chapters.length} chapters</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${chapters.length ? (completedChapters.length / chapters.length) * 100 : 0}%`,
                }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {chapters.map((chapter, index) => {
          const isCompleted = completedChapters.includes(chapter.id);
          const isUnlocked = index === 0 || completedChapters.includes(chapters[index - 1].id);
          const isCurrent = currentIndex === index && isUnlocked && !isCompleted;
          const stage = getStageLabel(index);

          const CardContent = (
            <div
              className={`group relative h-full overflow-hidden rounded-[2rem] border p-6 text-left transition-all duration-300 ${
                isCompleted
                  ? 'border-emerald-500/25 bg-emerald-500/8'
                  : isCurrent
                    ? 'border-blue-500/35 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]'
                    : isUnlocked
                      ? 'border-white/10 bg-white/[0.03] hover:border-white/20'
                      : 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-45 grayscale'
              }`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-px ${
                  isCompleted
                    ? 'bg-emerald-400/40'
                    : isCurrent
                      ? 'bg-blue-400/50'
                      : 'bg-white/10'
                }`}
              />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                      Chapter {index + 1}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                      {stage}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-black tracking-tight text-white">{chapter.title}</h3>
                </div>

                {isCompleted ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                ) : isCurrent ? (
                  <Orbit className="h-6 w-6 text-blue-400" />
                ) : !isUnlocked ? (
                  <Lock className="h-6 w-6 text-zinc-600" />
                ) : (
                  <Play className="h-6 w-6 text-zinc-500" />
                )}
              </div>

              <p className="mt-4 min-h-[72px] text-sm leading-7 text-zinc-400">{chapter.description}</p>

              <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-[#060912] px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span className="font-bold">{chapter.xp} XP</span>
                </div>
                <div
                  className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] ${
                    isCompleted
                      ? 'text-emerald-300'
                      : isCurrent
                        ? 'text-blue-300'
                        : isUnlocked
                          ? 'text-zinc-400'
                          : 'text-zinc-600'
                  }`}
                >
                  {isCompleted
                    ? 'Completed'
                    : isCurrent
                      ? 'Continue'
                      : isUnlocked
                        ? 'Available'
                        : 'Locked'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          );

          return (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={isUnlocked ? { y: -4 } : {}}
              className="h-full"
            >
              {onChapterClick ? (
                <button
                  onClick={() => isUnlocked && onChapterClick(chapter)}
                  className="h-full w-full"
                >
                  {CardContent}
                </button>
              ) : (
                <Link href={isUnlocked ? `/chapter/${chapter.id}` : '#'} className="block h-full">
                  {CardContent}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
