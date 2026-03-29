'use client';

import { useState, useEffect } from 'react';
import { Lesson, evaluateAnswer } from '@/lib/aiEngine';
import { Play, Lightbulb, Info, CheckCircle, XCircle, ChevronRight, ChevronLeft, Loader2, Code } from 'lucide-react';
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

export default function AiLessonView({ lesson, onComplete, onNext, onPrev, isFirst, isLast }: AiLessonViewProps) {
  const [activeTab, setActiveTab] = useState<'theory' | 'practice'>('theory');
  const [userQuery, setUserQuery] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [exampleResult, setExampleResult] = useState<any>(null);
  const [practiceResult, setPracticeResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setActiveTab('theory');
    setUserQuery('');
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
      setIsCorrect(correct);
      
      if (correct) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4">
      {/* Lesson Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            lesson.difficulty === 'beginner' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
            lesson.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
            'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {lesson.difficulty}
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">{lesson.title}</h1>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('theory')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'theory' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            1. Theory
          </button>
          <button 
            onClick={() => setActiveTab('practice')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'practice' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            2. Practice
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'theory' ? (
          <motion.div 
            key="theory"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Theory Section */}
                <div className="glass-card p-8 bg-blue-500/5 border-l-4 border-l-blue-500">
                  <h3 className="text-blue-400 font-black uppercase tracking-[0.2em] text-xs mb-4">1. Theoretical Foundation</h3>
                  <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                    {lesson.theory}
                  </p>
                </div>

                {/* Concept Section */}
                <div className="glass-card p-8 bg-indigo-500/5 border-l-4 border-l-indigo-500">
                  <h3 className="text-indigo-400 font-black uppercase tracking-[0.2em] text-xs mb-4">2. Practical Concept</h3>
                  <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                    {lesson.concept}
                  </p>
                </div>

                {/* Syntax & Pitfalls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6 bg-white/5 border border-white/10">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                      <Code className="h-4 w-4 text-purple-400" /> Key Syntax
                    </h3>
                    <div className="bg-[#0a0f1c] p-4 rounded-lg font-mono text-sm text-purple-300 border border-white/5">
                      {lesson.syntax}
                    </div>
                  </div>
                  <div className="glass-card p-6 bg-red-500/5 border border-red-500/20">
                    <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Common Pitfalls
                    </h3>
                    <p className="text-gray-400 text-sm italic leading-relaxed">
                      {lesson.commonPitfalls}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="glass-card p-6 bg-white/5 border border-white/10">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Play className="h-4 w-4 text-blue-400" /> Interactive Example
                  </h3>
                  <div className="bg-[#0a0f1c] rounded-lg p-4 font-mono text-sm text-blue-300 mb-4 border border-white/5">
                    {lesson.example.query}
                  </div>
                  <button 
                    onClick={handleRunExample}
                    disabled={isRunning}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Run & See Result
                  </button>
                  <p className="mt-4 text-xs text-gray-500 italic text-center">
                    {lesson.example.explanation}
                  </p>
                </div>

                {exampleResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-4 bg-white/5 border border-white/10 overflow-auto max-h-[300px]"
                  >
                    <DataTable 
                      columns={exampleResult.columns.map((c: string) => ({ header: c, accessorKey: c }))}
                      data={exampleResult.values.map((row: any[]) => {
                        const obj: any = {};
                        exampleResult.columns.forEach((col: string, i: number) => obj[col] = row[i]);
                        return obj;
                      })}
                    />
                  </motion.div>
                )}

                <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6 flex gap-4 items-start">
                  <Info className="h-6 w-6 text-blue-400 shrink-0" />
                  <div>
                    <h4 className="text-blue-400 font-bold mb-1 uppercase tracking-wider text-[10px]">Pro Insight</h4>
                    <p className="text-gray-300 text-xs leading-relaxed italic">
                      &quot;{lesson.insight}&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button 
                onClick={() => setActiveTab('practice')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-black tracking-tight shadow-xl transition-all flex items-center gap-2"
              >
                Go to Practice <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="practice"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <div className="glass-card p-8 bg-purple-500/5 border-l-4 border-l-purple-500">
              <h3 className="text-purple-400 font-black uppercase tracking-[0.2em] text-xs mb-4">The Challenge</h3>
              <p className="text-white text-xl font-medium leading-relaxed">
                {lesson.tryIt.question}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0f1c]">
                  <SqlEditor 
                    value={userQuery}
                    onChange={setUserQuery}
                    onRun={handleRunPractice}
                  />
                  <div className="bg-white/5 p-4 flex justify-between items-center border-t border-white/10">
                    <button 
                      onClick={() => setShowHint(!showHint)}
                      className="text-sm font-bold text-yellow-500 hover:text-yellow-400 flex items-center gap-2 transition-colors"
                    >
                      <Lightbulb className="h-5 w-5" />
                      {showHint ? "Hide Hint" : "Stuck? Get a hint"}
                    </button>
                    <button 
                      onClick={handleRunPractice}
                      disabled={isRunning || !userQuery.trim()}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-8 py-3 rounded-xl font-black tracking-tight shadow-lg transition-all flex items-center gap-2"
                    >
                      {isRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                      Submit Query
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showHint && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-yellow-200 text-sm leading-relaxed italic">
                        <span className="font-bold block mb-1">Hint:</span> {lesson.hint}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isCorrect !== null && (
                  <div className={`p-6 rounded-2xl flex items-start gap-4 animate-in zoom-in-95 duration-300 ${
                    isCorrect ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}>
                    {isCorrect ? <CheckCircle className="h-8 w-8 shrink-0" /> : <XCircle className="h-8 w-8 shrink-0" />}
                    <div>
                      <p className="font-black text-lg">{isCorrect ? "MISSION ACCOMPLISHED!" : "ACCESS DENIED"}</p>
                      <p className="text-sm opacity-90 leading-relaxed">
                        {isCorrect 
                          ? "Your query returned the correct results. You've successfully applied the concept!" 
                          : "Something went wrong. Check your syntax and the expected concept, then try again."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                  <Info className="h-4 w-4" /> Query Result
                </h3>
                <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl min-h-[300px] overflow-auto">
                  {practiceResult ? (
                    <DataTable 
                      columns={practiceResult.columns.map((c: string) => ({ header: c, accessorKey: c }))}
                      data={practiceResult.values.map((row: any[]) => {
                        const obj: any = {};
                        practiceResult.columns.forEach((col: string, i: number) => obj[col] = row[i]);
                        return obj;
                      })}
                    />
                  ) : error ? (
                    <div className="p-8 text-red-400 font-mono text-xs whitespace-pre-wrap">
                      {error}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 text-sm italic p-12 text-center gap-4">
                      <Code className="h-12 w-12 opacity-20" />
                      Run your query to see the output here
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-8 border-t border-white/10">
              <button
                onClick={() => setActiveTab('theory')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-all font-bold"
              >
                <ChevronLeft className="h-5 w-5" /> Back to Theory
              </button>
              
              <div className="flex gap-4">
                <button
                  onClick={onNext}
                  className={`${isLast ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'} text-white px-10 py-4 rounded-2xl font-black tracking-tight shadow-xl transition-all flex items-center gap-2`}
                >
                  {isLast ? "Complete Path" : "Next Lesson"} 
                  {isLast ? <CheckCircle className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
