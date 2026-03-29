'use client';

import { useEffect, useState } from 'react';
import { Lesson, evaluateAnswer } from '@/lib/aiEngine';
import {
  Play,
  Lightbulb,
  Info,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Code,
  Target,
  Brain,
  Sparkles,
} from 'lucide-react';
import SqlEditor from './SqlEditor';
import { runQuery } from '@/lib/db';
import DataTable from './DataTable';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface AiLessonViewProps {
  lesson: Lesson;
  onComplete: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function resultToRows(result: any) {
  if (!result) return [];
  return result.values.map((row: any[]) => {
    const nextRow: Record<string, unknown> = {};
    result.columns.forEach((column: string, index: number) => {
      nextRow[column] = row[index];
    });
    return nextRow;
  });
}

export default function AiLessonView({
  lesson,
  onComplete,
  onNext,
  onPrev,
  isFirst,
  isLast,
}: AiLessonViewProps) {
  const [activeTab, setActiveTab] = useState<'theory' | 'practice'>('theory');
  const [userQuery, setUserQuery] = useState(lesson.tryIt.starterQuery ?? '');
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [exampleResult, setExampleResult] = useState<any>(null);
  const [practiceResult, setPracticeResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setActiveTab('theory');
    setUserQuery(lesson.tryIt.starterQuery ?? '');
    setShowHint(false);
    setIsCorrect(null);
    setExampleResult(null);
    setPracticeResult(null);
    setError(null);
  }, [lesson]);

  const handleRunExample = async () => {
    setIsRunning(true);
    try {
      const result = await runQuery(lesson.example.query);
      setExampleResult(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunPractice = async () => {
    setIsRunning(true);
    try {
      const result = await runQuery(userQuery);
      setPracticeResult(result);

      const correct = evaluateAnswer(userQuery, lesson.tryIt.expectedConcept);
      setIsCorrect(correct.passed);

      if (correct) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        onComplete();
      }
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setIsCorrect(false);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4">
      <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_28%),linear-gradient(135deg,#08101d,#05070d)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em] ${
                  lesson.difficulty === 'beginner'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : lesson.difficulty === 'intermediate'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                {lesson.difficulty}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em] text-zinc-400">
                Guided Lesson
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
              {lesson.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
              {lesson.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                Mental Model
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-200">{lesson.mentalModel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                When To Use It
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-200">{lesson.whenToUse}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
        <button
          onClick={() => setActiveTab('theory')}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
            activeTab === 'theory' ? 'bg-blue-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Learn
        </button>
        <button
          onClick={() => setActiveTab('practice')}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
            activeTab === 'practice'
              ? 'bg-fuchsia-500 text-white shadow-lg'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Practice
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'theory' ? (
          <motion.div
            key="theory"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
          >
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-[#08111d] p-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-blue-300">
                  <Target className="h-4 w-4" />
                  Learning Objectives
                </div>
                <div className="mt-5 grid gap-3">
                  {lesson.learningObjectives.map((objective) => (
                    <div
                      key={objective}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-200"
                    >
                      {objective}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/5 p-6">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">
                  Why This Exists
                </div>
                <p className="mt-4 text-base leading-8 text-zinc-200 whitespace-pre-wrap">
                  {lesson.theory}
                </p>
              </div>

              <div className="rounded-[2rem] border border-indigo-500/20 bg-indigo-500/5 p-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-indigo-300">
                  <Brain className="h-4 w-4" />
                  How It Works In Practice
                </div>
                <p className="mt-4 text-base leading-8 text-zinc-200 whitespace-pre-wrap">
                  {lesson.concept}
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Code className="h-4 w-4 text-fuchsia-300" />
                    Core Syntax
                  </div>
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-[#050913] p-4 font-mono text-sm leading-6 text-fuchsia-200">
                    {lesson.syntax}
                  </pre>
                  <div className="mt-4 space-y-2">
                    {lesson.syntaxPatterns.map((pattern) => (
                      <div
                        key={pattern}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-zinc-300"
                      >
                        {pattern}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-rose-500/20 bg-rose-500/5 p-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-rose-300">
                    <XCircle className="h-4 w-4" />
                    Mistakes To Avoid
                  </div>
                  <div className="mt-4 space-y-3">
                    {lesson.commonPitfalls.map((pitfall) => (
                      <div
                        key={pitfall}
                        className="rounded-xl border border-rose-500/20 bg-[#140a10] p-3 text-sm leading-6 text-rose-100"
                      >
                        {pitfall}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-[#08111d] p-6">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Play className="h-4 w-4 text-blue-300" />
                  Worked Example
                </div>
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-[#050913] p-4 font-mono text-sm leading-6 text-blue-200">
                  {lesson.example.query}
                </pre>
                <p className="mt-4 text-sm leading-7 text-zinc-300">{lesson.example.explanation}</p>
                <div className="mt-4 space-y-2">
                  {lesson.example.breakdown.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-zinc-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleRunExample}
                  disabled={isRunning}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white transition-colors hover:bg-blue-700"
                >
                  {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Run Example
                </button>
              </div>

              {exampleResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                    Example Output
                  </div>
                  <DataTable
                    columns={exampleResult.columns.map((column: string) => ({
                      header: column,
                      accessorKey: column,
                    }))}
                    data={resultToRows(exampleResult)}
                  />
                </motion.div>
              )}

              <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-amber-300">
                  <Sparkles className="h-4 w-4" />
                  Expert Insight
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-200">{lesson.insight}</p>
              </div>

              <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-6">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
                  Recap
                </div>
                <div className="mt-4 space-y-2">
                  {lesson.recap.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-emerald-500/20 bg-[#07130f] p-3 text-sm leading-6 text-emerald-100"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="xl:col-span-2 flex justify-between">
              <button
                onClick={onPrev}
                disabled={isFirst || !onPrev}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Lesson
              </button>
              <button
                onClick={() => setActiveTab('practice')}
                className="flex items-center gap-2 rounded-2xl bg-fuchsia-600 px-6 py-3 font-black text-white transition-colors hover:bg-fuchsia-700"
              >
                Go To Practice
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="practice"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"
          >
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-fuchsia-500/20 bg-fuchsia-500/5 p-6">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-fuchsia-300">
                  Practice Challenge
                </div>
                <p className="mt-4 text-lg leading-8 text-white">{lesson.tryIt.question}</p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-[#08111d] p-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-zinc-500">
                  <Target className="h-4 w-4" />
                  Success Checklist
                </div>
                <div className="mt-4 space-y-2">
                  {lesson.tryIt.successChecklist.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-zinc-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#050913]">
                <SqlEditor value={userQuery} onChange={setUserQuery} onRun={handleRunPractice} />
                <div className="flex flex-col gap-3 border-t border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-2 text-sm font-bold text-amber-400 transition-colors hover:text-amber-300"
                  >
                    <Lightbulb className="h-4 w-4" />
                    {showHint ? 'Hide Hint' : 'Need a Hint?'}
                  </button>
                  <button
                    onClick={handleRunPractice}
                    disabled={isRunning || !userQuery.trim()}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-fuchsia-600 px-5 py-3 font-black text-white transition-colors hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Run Query
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6 text-sm leading-7 text-amber-100">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.24em] text-amber-300">
                        Hint
                      </span>
                      {lesson.hint}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isCorrect !== null && (
                <div
                  className={`rounded-[2rem] border p-6 ${
                    isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="mt-0.5 h-6 w-6 shrink-0" />
                    ) : (
                      <XCircle className="mt-0.5 h-6 w-6 shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-black uppercase tracking-[0.2em]">
                        {isCorrect ? 'Correct Direction' : 'Try Another Pass'}
                      </div>
                      <p className="mt-2 text-sm leading-7">
                        {isCorrect
                          ? 'Your query uses the right concept and completed the challenge successfully.'
                          : 'The query ran, but it did not demonstrate the expected concept clearly enough yet.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-[#08111d] p-6">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Info className="h-4 w-4 text-blue-300" />
                  Query Result
                </div>
                <div className="mt-4 min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#050913]">
                  {practiceResult ? (
                    <DataTable
                      columns={practiceResult.columns.map((column: string) => ({
                        header: column,
                        accessorKey: column,
                      }))}
                      data={resultToRows(practiceResult)}
                    />
                  ) : error ? (
                    <div className="p-6 font-mono text-sm leading-6 text-rose-300">{error}</div>
                  ) : (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center text-zinc-600">
                      <Code className="h-12 w-12 opacity-30" />
                      <p className="text-sm">Run your SQL to inspect the output here.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/5 p-6">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">
                  Evaluation Rule
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-200">
                  This lesson checks whether your solution uses the target concept:
                  <span className="ml-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 font-mono text-blue-200">
                    {lesson.tryIt.expectedConcept}
                  </span>
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setActiveTab('theory')}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-zinc-400 transition-colors hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back To Learn
                </button>
                <button
                  onClick={onNext}
                  disabled={!onNext}
                  className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-black text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLast ? 'Complete Path' : 'Next Lesson'}
                  {isLast ? <CheckCircle className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
