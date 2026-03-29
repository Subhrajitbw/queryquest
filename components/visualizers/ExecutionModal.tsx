'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Play, Pause, SkipForward, SkipBack, RotateCcw, 
  Database, Search, Filter, Layers, ArrowRight, 
  Cpu, HardDrive, AlertCircle, CheckCircle2, ChevronRight,
  TerminalSquare, ArrowDown, Link2, ListFilter, Table as TableIcon,
  Sparkles, Lightbulb
} from 'lucide-react';
import { ExecutionStep, Phase, Operation } from '@/lib/executionEngine';
import { StepExplanation } from '@/lib/explanationEngine';
import { getAIExplanation } from '@/lib/aiEngine';
import DataTable from '@/components/DataTable';
import { useStepPlayer } from '@/hooks/useStepPlayer';

interface ExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: ExecutionStep[];
  query: string;
}

const PHASE_ICONS: Record<Phase, React.ReactNode> = {
  PARSE: <Search className="w-5 h-5 text-blue-400" />,
  VALIDATE: <Search className="w-5 h-5 text-purple-400" />,
  PLAN: <Search className="w-5 h-5 text-indigo-400" />,
  ACCESS: <Database className="w-5 h-5 text-indigo-400" />,
  EXECUTE: <Cpu className="w-5 h-5 text-orange-400" />,
  RESULT: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  ERROR: <AlertCircle className="w-5 h-5 text-red-500" />
};

const OPERATION_ICONS: Record<string, React.ReactNode> = {
  TOKENIZE: <Search className="w-4 h-4" />,
  SYNTAX_CHECK: <Search className="w-4 h-4" />,
  SEMANTIC_CHECK: <Search className="w-4 h-4" />,
  PLAN_BUILD: <Layers className="w-4 h-4" />,
  TABLE_SCAN: <Database className="w-4 h-4" />,
  INDEX_SCAN: <Database className="w-4 h-4" />,
  FILTER: <Filter className="w-4 h-4" />,
  JOIN: <Layers className="w-4 h-4" />,
  GROUP: <Layers className="w-4 h-4" />,
  AGGREGATE: <Layers className="w-4 h-4" />,
  SORT: <ArrowRight className="w-4 h-4 rotate-90" />,
  LIMIT: <SkipForward className="w-4 h-4" />,
  PROJECT: <Search className="w-4 h-4" />,
  RETURN: <CheckCircle2 className="w-4 h-4" />
};

const SubqueryVisualizer = ({ step }: { step: ExecutionStep }) => {
  const { visual } = step;
  if (!visual) return null;

  if (visual.type === 'subquery-start') {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-blue-500/5 rounded-3xl border border-blue-500/20 border-dashed">
        <div className="p-4 rounded-full bg-blue-500/10 mb-4 animate-pulse">
          <Layers className="w-12 h-12 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Entering Subquery</h3>
        <p className="text-zinc-400 text-sm max-w-md text-center">
          The database engine is now executing a nested query to retrieve values needed for the main query&apos;s filter.
        </p>
      </div>
    );
  }

  if (visual.type === 'subquery-result') {
    const isEmpty = !(visual as any).result || (visual as any).result.length === 0;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-green-400">
          <CheckCircle2 className="w-5 h-5" />
          <h3 className="text-lg font-bold">Subquery Execution Complete</h3>
        </div>
        <p className="text-zinc-400 text-sm">
          {isEmpty 
            ? "The nested query executed but returned no results. This will cause the main query's filter to match nothing."
            : "The nested query has finished executing. The results shown below will be used to filter the main query."}
        </p>
        {isEmpty && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Empty subquery result detected.</span>
          </div>
        )}
      </div>
    );
  }

  if (visual.type === 'subquery') {
    const { parentTable, subTable, connectionColumn, resultValues } = visual as any;
    return (
      <div className="flex flex-col gap-8 py-12 bg-zinc-900/30 rounded-3xl border border-white/5">
        <div className="flex items-center justify-around px-12 relative">
          {/* Main Table Side */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 flex items-center justify-center">
              <Database className="w-12 h-12 text-blue-400" />
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Main Table</div>
              <div className="text-lg font-bold text-white">{parentTable}</div>
            </div>
          </div>

          {/* Connection Visual */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-[200px]">
            <div className="text-[10px] font-mono text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
              WHERE {connectionColumn} IN (...)
            </div>
            <div className="h-px w-full bg-gradient-to-r from-blue-500/50 to-green-500/50 relative">
              <motion.div 
                animate={{ x: [0, 200], opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full blur-sm"
              />
            </div>
            <Link2 className="w-5 h-5 text-zinc-500" />
          </div>

          {/* Subquery Result Side */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-2xl border-2 border-green-500/30 bg-green-500/5 flex items-center justify-center">
              <ListFilter className="w-12 h-12 text-green-400" />
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Subquery Result</div>
              <div className="text-lg font-bold text-white">{subTable} Values</div>
            </div>
          </div>
        </div>

        {/* Result Values Chips */}
        <div className="px-12 flex flex-wrap justify-center gap-2">
          {resultValues?.map((val: any, i: number) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-mono text-green-400"
            >
              {val}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

const JoinVisualizer = ({ step }: { step: ExecutionStep }) => {
  const { visual } = step;
  if (!visual || visual.type !== 'join') return null;

  return (
    <div className="flex flex-col items-center gap-12 py-12 bg-zinc-900/30 rounded-3xl border border-white/5">
      <div className="flex items-center justify-center gap-12 relative h-48">
        {/* Left Circle */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-48 h-48 rounded-full border-4 border-blue-500/50 bg-blue-500/10 flex items-center justify-center relative z-10"
        >
          <div className="text-center">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Left Table</div>
            <div className="text-lg font-bold text-white">{visual.leftTable}</div>
          </div>
        </motion.div>

        {/* Right Circle */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-48 h-48 rounded-full border-4 border-purple-500/50 bg-purple-500/10 flex items-center justify-center -ml-16 relative z-0"
        >
          <div className="text-center pl-8">
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Right Table</div>
            <div className="text-lg font-bold text-white">{visual.rightTable}</div>
          </div>
        </motion.div>

        {/* Intersection Highlight */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="w-16 h-32 bg-yellow-500/20 blur-xl rounded-full flex items-center justify-center">
             {visual.matches !== undefined && visual.matches > 0 && (
               <div className="text-[10px] font-bold text-yellow-500 bg-zinc-950/80 px-2 py-1 rounded-full border border-yellow-500/20 whitespace-nowrap">
                 {visual.matches} Matches Found
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Row Matching Visualization */}
      <div className="w-full px-12 grid grid-cols-3 gap-8 items-center">
        <div className="space-y-2">
          {visual.leftRows?.map((row: any, i: number) => (
            <motion.div 
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-2 bg-blue-500/5 border border-blue-500/20 rounded text-[10px] font-mono text-blue-300 truncate"
            >
              {JSON.stringify(row)}
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="h-px w-full bg-gradient-to-r from-blue-500/50 via-yellow-500/50 to-purple-500/50" />
          <div className="px-3 py-1 bg-zinc-800 rounded-full border border-white/10 text-[10px] font-mono text-yellow-400">
            {visual.matchingKeys?.join(' = ')}
          </div>
          <div className="h-px w-full bg-gradient-to-r from-blue-500/50 via-yellow-500/50 to-purple-500/50" />
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
            {visual.joinType} JOIN
          </div>
        </div>

        <div className="space-y-2">
          {visual.rightRows?.map((row: any, i: number) => (
            <motion.div 
              key={i}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-2 bg-purple-500/5 border border-purple-500/20 rounded text-[10px] font-mono text-purple-300 truncate text-right"
            >
              {JSON.stringify(row)}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ExecutionModal({ isOpen, onClose, steps, query }: ExecutionModalProps) {
  const [speed, setSpeed] = useState(1);
  const [aiExplanations, setAiExplanations] = useState<Record<number, StepExplanation>>({});
  const [isExplaining, setIsExplaining] = useState(false);

  const {
    currentStep,
    currentStepData,
    isPlaying,
    next,
    prev,
    reset,
    play,
    pause,
    goToStep,
    totalSteps
  } = useStepPlayer(steps, 1500 / speed);

  useEffect(() => {
    setAiExplanations({});
  }, [steps]);

  const handleExplainDeeper = async () => {
    if (!currentStepData || aiExplanations[currentStep] || isExplaining) return;
    
    setIsExplaining(true);
    try {
      const explanation = await getAIExplanation(query, currentStepData);
      setAiExplanations(prev => ({ ...prev, [currentStep]: explanation }));
    } catch (error) {
      console.error("AI Explanation failed:", error);
    } finally {
      setIsExplaining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col font-sans"
    >
      {/* TOP BAR */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-900">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="bg-zinc-800 px-3 py-1.5 rounded text-xs font-mono text-blue-400 truncate max-w-2xl border border-white/5">
            {query}
          </div>
          <div className="text-zinc-500 text-sm font-medium whitespace-nowrap">
            Step <span className="text-white">{currentStep + 1}</span> / {totalSteps}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-zinc-400" />
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Step Details */}
        <div className="w-80 border-r border-white/10 bg-zinc-900/50 overflow-y-auto p-6 flex flex-col gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
              {PHASE_ICONS[currentStepData?.phase || 'RESULT']}
              {currentStepData?.phase}
              {currentStepData?.operation && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-blue-400">{currentStepData.operation}</span>
                </>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white leading-tight">
              {currentStepData?.title}
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {currentStepData?.description}
            </p>
            {currentStepData?.explanation && (
              <div className="mt-4 space-y-4">
                {typeof currentStepData.explanation === 'string' ? (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-zinc-500 text-xs leading-relaxed italic">
                      {currentStepData.explanation}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                      <h4 className="text-sm font-bold text-white mb-1">
                        {currentStepData.explanation.what}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {currentStepData.explanation.why}
                      </p>
                    </div>

                    {currentStepData.explanation.analogy && (
                      <details className="group">
                        <summary className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors list-none">
                          <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                          View Analogy
                        </summary>
                        <div className="mt-2 p-3 bg-zinc-800/50 rounded-lg border border-white/5 text-xs text-zinc-400 italic leading-relaxed">
                          {currentStepData.explanation.analogy}
                        </div>
                      </details>
                    )}

                    {currentStepData.explanation.tip && (
                      <div className="p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20 flex gap-3">
                        <Lightbulb className="w-4 h-4 text-yellow-500 shrink-0" />
                        <p className="text-[10px] text-yellow-200/70 leading-relaxed">
                          <span className="font-bold text-yellow-500 uppercase mr-1">Pro Tip:</span>
                          {currentStepData.explanation.tip}
                        </p>
                      </div>
                    )}

                    <button 
                      className={`w-full py-2 px-4 rounded-lg bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={handleExplainDeeper}
                      disabled={isExplaining || !!aiExplanations[currentStep]}
                    >
                      <Sparkles className={`w-3 h-3 text-purple-400 ${isExplaining ? 'animate-spin' : 'group-hover:animate-pulse'}`} />
                      <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                        {isExplaining ? 'Thinking...' : aiExplanations[currentStep] ? 'Deep Dive Complete' : 'Explain Deeper'}
                      </span>
                    </button>

                    {aiExplanations[currentStep] && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-purple-500/10 rounded-xl border border-purple-500/30 space-y-3"
                      >
                        <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                          <Sparkles className="w-3 h-3" />
                          AI Deep Dive
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white mb-1">
                            {aiExplanations[currentStep].what}
                          </h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {aiExplanations[currentStep].why}
                          </p>
                        </div>
                        {aiExplanations[currentStep].analogy && (
                          <div className="p-3 bg-zinc-800/50 rounded-lg border border-white/5 text-xs text-zinc-400 italic leading-relaxed">
                            {aiExplanations[currentStep].analogy}
                          </div>
                        )}
                        {aiExplanations[currentStep].tip && (
                          <div className="p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20 flex gap-3">
                            <Lightbulb className="w-4 h-4 text-yellow-500 shrink-0" />
                            <p className="text-[10px] text-yellow-200/70 leading-relaxed">
                              {aiExplanations[currentStep].tip}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Execution Stats */}
          <div className="space-y-4 pt-6 border-t border-white/5">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Metadata</h3>
            <div className="grid grid-cols-1 gap-3">
              {currentStepData?.metadata?.table && (
                <div className="bg-zinc-800/50 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Table</div>
                  <div className="text-sm font-mono text-blue-400">{currentStepData.metadata.table}</div>
                </div>
              )}
              {(currentStepData?.metadata as any)?.tokens && (
                <div className="bg-zinc-800/50 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Tokens</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(currentStepData?.metadata as any).tokens.map((token: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] font-mono text-blue-300">
                        {token}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(currentStepData?.metadata as any)?.plan && (
                <div className="bg-zinc-800/50 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-3">Execution Pipeline</div>
                  <div className="space-y-2">
                    {(currentStepData?.metadata as any).plan.map((op: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-white">
                          {i + 1}
                        </div>
                        <div className="text-xs font-medium text-zinc-300">{op}</div>
                        {i < (currentStepData?.metadata as any).plan.length - 1 && (
                          <ArrowDown className="w-3 h-3 text-zinc-600 ml-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {currentStepData?.metadata?.condition && (
                <div className="bg-zinc-800/50 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Condition</div>
                  <div className="text-sm font-mono text-yellow-400">{currentStepData.metadata.condition}</div>
                </div>
              )}
              {currentStepData?.metadata?.rowsReturned !== undefined && (
                <div className="bg-zinc-800/50 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Rows Returned</div>
                  <div className="text-lg font-mono text-green-400">{currentStepData.metadata.rowsReturned}</div>
                </div>
              )}
            </div>
          </div>

          {/* Step History List */}
          <div className="flex-1 space-y-2 mt-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Pipeline</h3>
            {steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => goToStep(idx)}
                className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 border ${
                  idx === currentStep 
                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                    : idx < currentStep
                    ? 'bg-zinc-800/30 border-transparent text-zinc-500'
                    : 'bg-transparent border-transparent text-zinc-600 hover:bg-white/5'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  idx === currentStep ? 'bg-blue-400 animate-pulse' : idx < currentStep ? 'bg-zinc-600' : 'bg-zinc-800'
                }`} />
                <span className="text-xs font-medium truncate">{step.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Visualization Canvas */}
        <div className="flex-1 bg-zinc-950 p-8 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Visual Indicators */}
              <div className="flex gap-4">
                {currentStepData?.visual?.showDisk && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-[10px] font-bold uppercase tracking-wider">
                    <HardDrive className="w-3 h-3" /> Disk Access
                  </div>
                )}
                {currentStepData?.visual?.showMemory && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 text-[10px] font-bold uppercase tracking-wider">
                    <Cpu className="w-3 h-3" /> Memory Pool
                  </div>
                )}
                {currentStepData?.visual?.showIndexTree && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-500 text-[10px] font-bold uppercase tracking-wider">
                    <Layers className="w-3 h-3" /> Index Tree
                  </div>
                )}
              </div>

              {/* Data Visualization */}
              <div className="grid grid-cols-1 gap-8">
                {/* Join Visualization */}
                {currentStepData?.visual?.type === 'join' && (
                  <JoinVisualizer step={currentStepData} />
                )}

                {/* Subquery Visualization */}
                {currentStepData?.visual?.type?.startsWith('subquery') && (
                  <SubqueryVisualizer step={currentStepData} />
                )}

                {/* Logical Steps UI */}
                {currentStepData?.phase === 'PARSE' && (
                  <div className="flex flex-col items-center justify-center py-12 bg-zinc-900/30 rounded-3xl border border-white/5 border-dashed">
                    <TerminalSquare className="w-12 h-12 text-blue-500/40 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Query Parsing</h3>
                    <p className="text-zinc-500 text-sm italic mb-8">Breaking down the SQL string into a structured Abstract Syntax Tree.</p>
                    
                    <div className="w-full max-w-2xl px-8">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Tokens Detected</div>
                      <div className="flex flex-wrap gap-2">
                        {(currentStepData?.metadata as any)?.tokens?.map((token: string, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.02 }}
                            className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs font-mono text-blue-300"
                          >
                            {token}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStepData?.phase === 'VALIDATE' && (
                  <div className="flex flex-col items-center justify-center py-12 bg-zinc-900/30 rounded-3xl border border-white/5 border-dashed">
                    <Search className="w-12 h-12 text-purple-500/40 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Semantic Validation</h3>
                    <p className="text-zinc-500 text-sm italic mb-8">Verifying that all referenced objects exist and the user has correct permissions.</p>
                    
                    <div className="grid grid-cols-3 gap-8 w-full max-w-3xl px-8">
                      <div className="space-y-3">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tables</div>
                        <div className="space-y-2">
                          {(currentStepData?.metadata as any)?.tables?.map((table: string, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                              <Database className="w-4 h-4 text-purple-400" />
                              <span className="text-sm font-bold text-white">{table}</span>
                              <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Joins</div>
                        <div className="space-y-2">
                          {(currentStepData?.metadata as any)?.joins?.length > 0 ? (
                            (currentStepData?.metadata as any).joins.map((join: string, i: number) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                                <Layers className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm font-bold text-white">{join}</span>
                                <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                              </div>
                            ))
                          ) : (
                            <div className="p-3 bg-zinc-800/50 border border-white/5 rounded-xl text-xs text-zinc-500 italic">
                              No joins in this query
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Columns</div>
                        <div className="space-y-2">
                          {(currentStepData?.metadata as any)?.columns?.map((col: string, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                              <TableIcon className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-bold text-white">{col}</span>
                              <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStepData?.phase === 'PLAN' && (
                  <div className="flex flex-col items-center justify-center py-12 bg-zinc-900/30 rounded-3xl border border-white/5 border-dashed">
                    <Layers className="w-12 h-12 text-indigo-500/40 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Query Optimization</h3>
                    <p className="text-zinc-500 text-sm italic mb-8">The optimizer is selecting the most efficient path to retrieve your data.</p>
                    
                    <div className="w-full max-w-2xl px-8">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 text-center">Execution Pipeline</div>
                      <div className="flex items-center justify-center gap-4">
                        {(currentStepData?.metadata as any)?.plan?.map((op: string, i: number) => (
                          <React.Fragment key={i}>
                            <motion.div
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex flex-col items-center gap-2"
                            >
                              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                                {OPERATION_ICONS[op] || <Layers className="w-5 h-5 text-indigo-400" />}
                              </div>
                              <div className="text-[10px] font-bold text-white uppercase tracking-tighter">{op}</div>
                            </motion.div>
                            {i < (currentStepData?.metadata as any).plan.length - 1 && (
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: i * 0.1 + 0.05 }}
                                className="w-8 h-px bg-indigo-500/30"
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Before */}
                {currentStepData?.dataBefore && currentStepData.dataBefore.length > 0 && 
                 !['PARSE', 'VALIDATE', 'PLAN'].includes(currentStepData.phase) && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      {currentStepData.isSubquery ? 'Subquery Input' : 'Input Data'}
                    </h3>
                    <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden opacity-60">
                      <DataTable 
                        columns={(currentStepData.metadata as any)?.columns?.map((c: string) => ({ header: c, accessorKey: c })) || 
                                 Object.keys(currentStepData.dataBefore[0] || {}).map(c => ({ header: c, accessorKey: c }))} 
                        data={currentStepData.dataBefore} 
                      />
                    </div>
                  </div>
                )}

                {/* Data After / Current State */}
                {currentStepData?.dataAfter && (currentStepData.dataAfter.length > 0 || currentStepData.phase === 'RESULT') && 
                 !['PARSE', 'VALIDATE', 'PLAN'].includes(currentStepData.phase) && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                      {currentStepData.phase === 'RESULT' 
                        ? (currentStepData.isSubquery ? 'Subquery Result' : 'Final Result') 
                        : (currentStepData.isSubquery ? 'Subquery State' : 'Current State')}
                    </h3>
                    <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden shadow-2xl shadow-blue-500/5">
                      <DataTable 
                        columns={(currentStepData.metadata as any)?.columns?.map((c: string) => ({ header: c, accessorKey: c })) || 
                                 Object.keys(currentStepData.dataAfter[0] || {}).map(c => ({ header: c, accessorKey: c }))} 
                        data={currentStepData.dataAfter} 
                        activeRowIndices={currentStepData.highlight?.rows}
                      />
                    </div>
                  </div>
                )}

                {/* Empty State / No Data */}
                {(!currentStepData?.dataAfter || (currentStepData.dataAfter.length === 0 && currentStepData.phase !== 'RESULT')) && 
                 (!currentStepData?.dataBefore || currentStepData.dataBefore.length === 0) && 
                 !['PARSE', 'VALIDATE', 'PLAN'].includes(currentStepData?.phase || '') && (
                  <div className="h-64 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-2xl">
                    <TerminalSquare className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm italic">No data to display for this phase.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="h-24 border-t border-white/10 bg-zinc-900 px-8 flex items-center gap-8">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={reset} className="p-2 hover:bg-white/5 rounded text-zinc-400" title="Reset">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={prev} className="p-2 hover:bg-white/5 rounded text-zinc-400" title="Previous">
            <SkipBack className="w-5 h-5" />
          </button>
          <button 
            onClick={isPlaying ? pause : play} 
            className="w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>
          <button onClick={next} className="p-2 hover:bg-white/5 rounded text-zinc-400" title="Next">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <span>Timeline</span>
            <span>{Math.round((currentStep / (totalSteps - 1)) * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max={totalSteps - 1} 
            value={currentStep} 
            onChange={(e) => goToStep(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-2 bg-zinc-800 p-1 rounded-lg border border-white/5">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                speed === s ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
