'use client';

import { useState } from 'react';
import { generateLearningPath, LearningPath, Chapter } from '@/lib/aiEngine';
import { useAppStore } from '@/lib/store';
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  BrainCircuit,
  Map as MapIcon,
  BookOpen,
  GraduationCap,
  Compass,
  LogOut,
} from 'lucide-react';
import AiLessonView from '@/components/AiLessonView';
import SkillTree from '@/components/SkillTree';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';

export default function LearningHubPage() {
  const [view, setView] = useState<'map' | 'lesson'>('map');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const { addXP, addBadge, completeChapter, completedChapters } = useAppStore();
  const router = useRouter();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleChapterClick = async (chapter: Chapter) => {
    setIsLoading(true);
    setError(null);
    setSelectedChapter(chapter);
    try {
      const path = await generateLearningPath(chapter.title);
      if (path) {
        setLearningPath(path);
        setCurrentLessonIndex(0);
        setCompletedLessons([]);
        setView('lesson');
      } else {
        setError("We couldn't generate a learning path for this chapter right now. Please try again.");
        setSelectedChapter(null);
      }
    } catch (err) {
      console.error('Failed to generate learning path:', err);
      setError('An unexpected error occurred. Please try again.');
      setSelectedChapter(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonComplete = () => {
    if (!completedLessons.includes(currentLessonIndex)) {
      setCompletedLessons((prev) => [...prev, currentLessonIndex]);
      addXP(50);
    }
  };

  const handleNext = () => {
    if (learningPath && currentLessonIndex < learningPath.lessons.length - 1) {
      setCurrentLessonIndex((prev) => prev + 1);
    } else {
      if (selectedChapter) {
        completeChapter(selectedChapter.id);
        addXP(selectedChapter.xp);
      }
      addBadge('ai_scholar');
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
      });
      setView('map');
      setLearningPath(null);
      setSelectedChapter(null);
    }
  };

  const handlePrev = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-300"
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Logout
          </button>
        </div>

        <AnimatePresence mode="wait">
          {view === 'map' && !isLoading ? (
            <motion.div
              key="map-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-12"
            >
              <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.15),transparent_28%),linear-gradient(135deg,#07101d,#040608)] p-8 md:p-12">
                <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">
                      <BrainCircuit className="h-4 w-4" />
                      AI Learning Hub
                    </div>
                    <h1 className="mt-6 text-5xl font-black tracking-tight text-white md:text-7xl">
                      Learn SQL like you are building a real system.
                    </h1>
                    <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-300 md:text-lg">
                      QueryQuest now treats the learning hub like a guided lab, not a chapter list.
                      Each chapter opens into a structured lesson path with theory, mental models,
                      runnable examples, and practice prompts tuned to your schema.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">
                        <MapIcon className="h-4 w-4 text-blue-300" />
                        Progress
                      </div>
                      <div className="mt-3 text-3xl font-black text-white">{completedChapters.length}</div>
                      <p className="mt-1 text-sm leading-6 text-zinc-400">chapters completed across your curriculum</p>
                    </div>
                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        Lesson Mode
                      </div>
                      <div className="mt-3 text-3xl font-black text-white">AI</div>
                      <p className="mt-1 text-sm leading-6 text-zinc-400">examples, hints, and learning objectives tuned per chapter</p>
                    </div>
                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">
                        <Compass className="h-4 w-4 text-emerald-300" />
                        Focus
                      </div>
                      <div className="mt-3 text-3xl font-black text-white">Stepwise</div>
                      <p className="mt-1 text-sm leading-6 text-zinc-400">start with intuition, then syntax, then challenge</p>
                    </div>
                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">
                        <GraduationCap className="h-4 w-4 text-fuchsia-300" />
                        Outcome
                      </div>
                      <div className="mt-3 text-3xl font-black text-white">Applied</div>
                      <p className="mt-1 text-sm leading-6 text-zinc-400">every path ends in a runnable SQL task, not just reading</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                  <div className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">
                    How This Hub Works
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {[
                      {
                        title: 'Pick a chapter',
                        body: 'Choose the next unlocked concept in the path, from SQL basics through DBMS internals.',
                      },
                      {
                        title: 'Study the lesson path',
                        body: 'Each chapter opens into a multi-lesson sequence with objectives, examples, and expert framing.',
                      },
                      {
                        title: 'Practice on real schema',
                        body: 'You write SQL against the actual sandbox database so every lesson stays grounded.',
                      },
                    ].map((item) => (
                      <div key={item.title} className="rounded-2xl border border-white/10 bg-[#07101b] p-4">
                        <div className="text-sm font-bold text-white">{item.title}</div>
                        <p className="mt-2 text-sm leading-7 text-zinc-400">{item.body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                  <div className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">
                    Sandbox Schema
                  </div>
                  <div className="mt-5 space-y-3">
                    {[
                      ['Users', 'identity, signup, account ownership'],
                      ['Products', 'catalog, pricing, categorization'],
                      ['Orders', 'purchase events, status, totals'],
                      ['Order_Items', 'line items and per-order detail'],
                      ['Categories', 'taxonomy and product grouping'],
                    ].map(([name, description]) => (
                      <div key={name} className="rounded-2xl border border-white/10 bg-[#07101b] p-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                          <BookOpen className="h-4 w-4 text-blue-300" />
                          {name}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">
                      Curriculum Map
                    </div>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                      Choose your next chapter
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
                      The path is ordered deliberately so the harder material makes sense when you reach it.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-5 text-sm font-bold text-rose-300">
                    {error}
                  </div>
                )}

                <SkillTree onChapterClick={handleChapterClick} />
              </section>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-6 py-32"
            >
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
                <Sparkles className="absolute -right-2 -top-2 h-6 w-6 animate-bounce text-amber-400" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Designing your lesson path...</h2>
                <p className="mt-2 text-zinc-500">
                  Building a more detailed chapter flow for &quot;{selectedChapter?.title}&quot;
                </p>
              </div>
            </motion.div>
          ) : view === 'lesson' && learningPath ? (
            <motion.div
              key="lesson-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <button
                    onClick={() => {
                      setView('map');
                      setLearningPath(null);
                      setSelectedChapter(null);
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-zinc-400 transition-colors hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to curriculum map
                  </button>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">
                      Chapter
                    </span>
                    <div className="text-sm text-zinc-300">{selectedChapter?.title}</div>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-white">{learningPath.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-400">
                      {learningPath.description}
                    </p>
                  </div>
                  <div className="text-sm text-zinc-400">
                    Lesson {currentLessonIndex + 1} of {learningPath.lessons.length}
                  </div>
                </div>

                <div className="flex gap-2">
                  {learningPath.lessons.map((lesson, index) => (
                    <div key={`${lesson.title}-${index}`} className="flex-1">
                      <div
                        className={`mb-2 h-2 rounded-full transition-all ${
                          index === currentLessonIndex
                            ? 'bg-blue-500'
                            : completedLessons.includes(index)
                              ? 'bg-emerald-500'
                              : 'bg-white/10'
                        }`}
                      />
                      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 line-clamp-1">
                        {lesson.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <AiLessonView
                lesson={learningPath.lessons[currentLessonIndex]}
                onComplete={handleLessonComplete}
                onNext={handleNext}
                onPrev={handlePrev}
                isFirst={currentLessonIndex === 0}
                isLast={currentLessonIndex === learningPath.lessons.length - 1}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
