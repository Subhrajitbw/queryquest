'use client';

import { useAppStore } from '@/lib/store';
import { generateMapChapters, Chapter } from '@/lib/aiEngine';
import { getChapterData } from '@/lib/chapter-data';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Star, BookOpen, Eye, Code, HelpCircle, Play, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SqlEditor from '@/components/SqlEditor';
import { runQuery } from '@/lib/db';
import confetti from 'canvas-confetti';
import QueryPipeline from '@/components/visualizers/QueryPipeline';
import JoinVisualizer from '@/components/visualizers/JoinVisualizer';
import TransactionVisualizer from '@/components/visualizers/TransactionVisualizer';
import ConcurrencyVisualizer from '@/components/visualizers/ConcurrencyVisualizer';
import StorageVisualizer from '@/components/visualizers/StorageVisualizer';
import SecurityVisualizer from '@/components/visualizers/SecurityVisualizer';
import DataTable, { ColumnDef } from '@/components/DataTable';

type TabType = 'learn' | 'visualize' | 'practice' | 'quiz';

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { completeChapter, addXP, completedChapters, addBadge } = useAppStore();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('learn');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Practice State
  const [query, setQuery] = useState('');
  const [practiceResult, setPracticeResult] = useState<{ columns: string[], values: any[][] } | null>(null);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [isPracticeCorrect, setIsPracticeCorrect] = useState(false);
  
  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  
  const chapterId = params.id as string;
  const chapter = chapters.find(c => c.id === chapterId);
  const chapterData = getChapterData(chapterId);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await generateMapChapters();
        setChapters(data);
        if (chapterData.practice.initialQuery) {
          setQuery(chapterData.practice.initialQuery);
        }
      } catch (err) {
        console.error("Failed to load chapter data:", err);
      } finally {
        setIsLoading(false);
        setMounted(true);
      }
    };
    loadData();
  }, [chapterData]);

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="text-gray-400">Loading chapter content...</p>
      </div>
    );
  }

  if (!chapter) {
    return <div className="text-center py-20 text-white">Chapter not found</div>;
  }

  const isCompleted = completedChapters.includes(chapter.id);

  const handleComplete = () => {
    if (!isCompleted) {
      completeChapter(chapter.id);
      addXP(chapter.xp);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      if (completedChapters.length + 1 === chapters.length) {
        addBadge('completionist');
      }
    }
    router.push('/');
  };

  const handleRunPractice = async () => {
    try {
      setPracticeError(null);
      const result = await runQuery(query);
      setPracticeResult(result || { columns: [], values: [] });
      
      addBadge('first_query');
      if (query.toUpperCase().includes('JOIN')) {
        addBadge('first_join');
      }
      
      // Check against expected query
      const expectedResult = await runQuery(chapterData.practice.expectedQuery);
      
      if (JSON.stringify(result) === JSON.stringify(expectedResult)) {
        setIsPracticeCorrect(true);
        if (!isCompleted) {
          addXP(50); // Bonus XP for practice
          confetti({ particleCount: 50, spread: 60 });
        }
      } else {
        setIsPracticeCorrect(false);
      }
    } catch (err: any) {
      setPracticeError(err.message);
      setPracticeResult(null);
      setIsPracticeCorrect(false);
    }
  };

  const handleQuizSubmit = () => {
    let score = 0;
    chapterData.quiz.forEach((q: any, i: number) => {
      if (quizAnswers[i] === q.answerIndex) score++;
    });
    setQuizScore(score);
    setQuizSubmitted(true);
    
    if (score === chapterData.quiz.length && !isCompleted) {
      addXP(50); // Bonus XP for perfect quiz
      confetti({ particleCount: 50, spread: 60 });
    }
  };

  const tabs = [
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'visualize', label: 'Visualize', icon: Eye },
    { id: 'practice', label: 'Practice', icon: Code },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col min-h-[calc(100vh-4rem)]">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Map
      </Link>
      
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{chapter.title}</h1>
          <p className="text-gray-400">{chapter.description}</p>
        </div>
        <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/30">
          <Star className="h-5 w-5 fill-current" />
          <span className="font-bold">+{chapter.xp} XP</span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      
      {/* Content Area */}
      <div className="glass-card flex-1 p-6 md:p-8 relative overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {/* LEARN TAB */}
          {activeTab === 'learn' && (
            <motion.div 
              key="learn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1"
            >
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 mb-8">
                <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-400 mb-3">
                  Chapter Overview
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">{chapterData.learn.title}</h2>
                <p className="text-gray-300 text-base leading-8">{chapterData.learn.summary}</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Core Explanation</h3>
                    <div className="space-y-5">
                      {chapterData.learn.content.split('\n\n').map((paragraph: string, i: number) => (
                        <p key={i} className="text-gray-300 text-base leading-8">{paragraph}</p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Deep Dive Sections</h3>
                    <div className="space-y-4">
                      {chapterData.learn.sections.map((section, index) => (
                        <div key={`${section.heading}-${index}`} className="rounded-2xl border border-white/10 bg-[#0a0f1c] p-5">
                          <h4 className="text-white font-semibold mb-2">{section.heading}</h4>
                          <p className="text-gray-400 text-sm leading-7">{section.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Learning Objectives</h3>
                    <div className="space-y-3">
                      {chapterData.learn.objectives.map((objective, index) => (
                        <div key={`${objective}-${index}`} className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm leading-7 text-blue-100">
                          {objective}
                        </div>
                      ))}
                    </div>
                  </div>

                  {chapterData.learn.examples.length > 0 && (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Worked Examples</h3>
                      <div className="space-y-3">
                        {chapterData.learn.examples.map((example: string, i: number) => (
                          <div key={i} className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-4 font-mono text-sm text-blue-300">
                            {example}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Common Mistakes</h3>
                    <div className="space-y-3">
                      {chapterData.learn.pitfalls.map((pitfall, index) => (
                        <div key={`${pitfall}-${index}`} className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-7 text-red-100">
                          {pitfall}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Key Takeaways</h3>
                    <div className="space-y-3">
                      {chapterData.learn.keyTakeaways.map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm leading-7 text-green-100">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* VISUALIZE TAB */}
          {activeTab === 'visualize' && (
            <motion.div 
              key="visualize"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col items-center w-full"
            >
              <div className="w-full max-w-4xl mx-auto">
                {chapterId === 'ch4' || chapterId === 'ch5' ? (
                  <JoinVisualizer />
                ) : chapterId === 'ch12' ? (
                  <TransactionVisualizer />
                ) : chapterId === 'ch13' ? (
                  <StorageVisualizer />
                ) : chapterId === 'ch14' ? (
                  <ConcurrencyVisualizer />
                ) : chapterId === 'ch15' ? (
                  <SecurityVisualizer />
                ) : (
                  <QueryPipeline />
                )}
              </div>
              <div className="mt-8 text-center">
                <p className="text-gray-400 mb-4">Want to explore more database concepts?</p>
                <Link href="/visualizers" className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-full font-medium transition-colors">
                  <Eye className="h-4 w-4" /> View All Visualizers
                </Link>
              </div>
            </motion.div>
          )}

          {/* PRACTICE TAB */}
          {activeTab === 'practice' && (
            <motion.div 
              key="practice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col h-full"
            >
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 mb-6">
                <h3 className="font-bold text-blue-400 mb-2">Task:</h3>
                <p className="text-gray-300">{chapterData.practice.question}</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 mb-6">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Starter Tips</h3>
                  <div className="space-y-3">
                    {chapterData.practice.starterTips.map((tip, index) => (
                      <div key={`${tip}-${index}`} className="rounded-xl border border-white/10 bg-[#0a0f1c] p-3 text-sm leading-7 text-gray-300">
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Success Checklist</h3>
                  <div className="space-y-3">
                    {chapterData.practice.successChecks.map((check, index) => (
                      <div key={`${check}-${index}`} className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm leading-7 text-green-100">
                        {check}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-h-[300px] border border-white/10 rounded-lg overflow-hidden flex flex-col mb-6">
                <div className="flex-1 relative">
                  <SqlEditor 
                    value={query} 
                    onChange={setQuery} 
                    onRun={handleRunPractice} 
                  />
                </div>
                <div className="bg-white/5 border-t border-white/10 p-3 flex justify-between items-center">
                  <div className="text-sm text-gray-400">Press <kbd className="bg-white/10 px-2 py-1 rounded text-xs">Ctrl</kbd> + <kbd className="bg-white/10 px-2 py-1 rounded text-xs">Enter</kbd> to run</div>
                  <button 
                    onClick={handleRunPractice}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
                  >
                    <Play className="h-4 w-4" /> Run Query
                  </button>
                </div>
              </div>

              {/* Practice Results */}
              {practiceError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 font-mono text-sm">
                  {practiceError}
                </div>
              )}
              
              {practiceResult && (
                <div className="mb-6">
                  <div className={`p-4 rounded-2xl mb-4 flex items-center gap-3 ${isPracticeCorrect ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'}`}>
                    {isPracticeCorrect ? <CheckCircle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
                    <span className="font-medium">
                      {isPracticeCorrect ? "Correct! Great job." : "That query ran successfully, but the results don't match what we expected. Try again!"}
                    </span>
                  </div>
                  
                  <div className="border border-white/10 rounded-lg overflow-hidden overflow-x-auto">
                    <DataTable
                      columns={practiceResult.columns.map(col => ({ header: col, accessorKey: col }))}
                      data={practiceResult.values.map(row => {
                        const rowData: any = {};
                        practiceResult.columns.forEach((col, i) => {
                          rowData[col] = row[i];
                        });
                        return rowData;
                      })}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* QUIZ TAB */}
          {activeTab === 'quiz' && (
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1"
            >
              <div className="space-y-8 mb-8">
                {chapterData.quiz.map((q: any, qIndex: number) => (
                  <div key={qIndex} className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-white mb-4">{qIndex + 1}. {q.question}</h3>
                    <div className="space-y-3">
                      {q.options.map((opt: string, oIndex: number) => {
                        const isSelected = quizAnswers[qIndex] === oIndex;
                        const isCorrect = q.answerIndex === oIndex;
                        const showCorrect = quizSubmitted && isCorrect;
                        const showWrong = quizSubmitted && isSelected && !isCorrect;
                        
                        return (
                          <button
                            key={oIndex}
                            disabled={quizSubmitted}
                            onClick={() => setQuizAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                            className={`w-full text-left px-4 py-3 rounded-md border transition-all flex items-center justify-between ${
                              showCorrect ? 'bg-green-500/20 border-green-500/50 text-green-400' :
                              showWrong ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                              isSelected ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' :
                              'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <span>{opt}</span>
                            {showCorrect && <Check className="h-4 w-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {!quizSubmitted ? (
                <button
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(quizAnswers).length < chapterData.quiz.length}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg font-bold transition-colors"
                >
                  Submit Answers
                </button>
              ) : (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      You scored {quizScore} out of {chapterData.quiz.length}!
                    </h3>
                  <p className="text-gray-400 mb-6">
                    {quizScore === chapterData.quiz.length ? 'Perfect score! Great job.' : 'Review the answers above and try again later.'}
                  </p>
                    <button
                      onClick={() => {
                        setQuizSubmitted(false);
                      setQuizAnswers({});
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-md font-medium transition-colors"
                  >
                    Retake Quiz
                  </button>
                  </div>
                )}

                {quizSubmitted && (
                  <div className="mt-8 space-y-4">
                    <h4 className="text-lg font-bold text-white">Why These Answers Matter</h4>
                    {chapterData.quiz.map((q: any, index: number) => (
                      <div key={`explanation-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <div className="text-sm font-semibold text-white mb-2">
                          {index + 1}. {q.question}
                        </div>
                        <p className="text-sm leading-7 text-gray-400">
                          {q.explanation || 'Review the concept above and compare it to the correct option.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer Actions */}
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Complete the practice and quiz to master this chapter.
        </div>
        <button
          onClick={handleComplete}
          className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all text-lg ${
            isCompleted 
              ? 'bg-green-500/20 text-green-500 border border-green-500/50 hover:bg-green-500/30'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle className="h-6 w-6" /> Chapter Completed
            </>
          ) : (
            <>
              Complete Chapter
            </>
          )}
        </button>
      </div>
    </div>
  );
}
