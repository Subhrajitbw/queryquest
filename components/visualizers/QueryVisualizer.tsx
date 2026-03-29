'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, Search, Filter, Layers, ArrowRight, 
  Cpu, HardDrive, AlertCircle, CheckCircle2, ChevronRight,
  TerminalSquare, ArrowDown, Link2, ListFilter, Table as TableIcon,
  RotateCcw, SkipBack, Play, Pause, SkipForward
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { buildExecutionSteps, ExecutionStep, Phase, Operation, parseQuery } from '@/lib/executionEngine';
import { initDB } from '@/lib/db';
import DataTable from '@/components/DataTable';
import { useStepPlayer } from '@/hooks/useStepPlayer';

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
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 flex items-center justify-center">
              <Database className="w-12 h-12 text-blue-400" />
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Main Table</div>
              <div className="text-lg font-bold text-white">{parentTable}</div>
            </div>
          </div>

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

export default function QueryVisualizer() {
  const { lastExecutedQuery } = useAppStore();
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    async function generateSteps() {
      if (!lastExecutedQuery) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const db = await initDB();
        const ast = parseQuery(lastExecutedQuery);
        if (ast) {
          const generatedSteps = await buildExecutionSteps(ast, db);
          setSteps(generatedSteps);
        } else {
          setError("Failed to parse query. Check your SQL syntax.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to analyze query execution.");
      } finally {
        setIsLoading(false);
      }
    }

    generateSteps();
  }, [lastExecutedQuery]);

  const player = useStepPlayer(steps, 1500 / speed);
  const { currentStep, totalSteps, isPlaying, play, pause, next, prev, reset, goToStep, currentStepData } = player;

  if (!lastExecutedQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-full bg-white/5 mb-4">
          <Database className="h-12 w-12 text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Query Executed</h3>
        <p className="text-gray-400 max-w-md">
          Go to the SQL Playground, run a query, and then come back here to see how it was executed step-by-step.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-12 w-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-400">Analyzing execution plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-full bg-red-500/10 mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Analysis Failed</h3>
        <p className="text-gray-400 max-w-md">{error}</p>
      </div>
    );
  }

  if (steps.length === 0) return null;

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto h-[calc(100vh-8rem)]">
      {/* TRANSACTION TIMELINE */}
      <div className="h-12 border-b border-white/10 flex items-center justify-center gap-4 bg-zinc-900/50 rounded-t-2xl">
        {['BEGIN', 'READ', 'WRITE', 'COMMIT'].map((stage, i) => (
          <div key={stage} className={`flex items-center gap-2 ${currentStepData?.visual?.stage === stage ? 'text-white font-bold' : 'text-zinc-600'}`}>
            {i > 0 && <ArrowRight className="w-4 h-4" />}
            <span className="text-xs uppercase tracking-widest">{stage}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden border border-white/10 rounded-b-2xl">
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
              <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-zinc-500 text-xs leading-relaxed italic">
                  {currentStepData.explanation}
                </p>
              </div>
            )}
          </div>

          {/* ACID Explanation Panel */}
          <div className="mt-auto pt-6 border-t border-white/5">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">ACID Properties</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
              <div className="p-2 bg-zinc-800/50 rounded border border-white/5"><strong>A</strong>tomicity</div>
              <div className="p-2 bg-zinc-800/50 rounded border border-white/5"><strong>C</strong>onsistency</div>
              <div className="p-2 bg-zinc-800/50 rounded border border-white/5"><strong>I</strong>solation</div>
              <div className="p-2 bg-zinc-800/50 rounded border border-white/5"><strong>D</strong>urability</div>
            </div>
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
              {/* Data Visualization */}
              <div className="grid grid-cols-1 gap-8">
                {currentStepData?.visual?.type === 'join' && (
                  <JoinVisualizer step={currentStepData} />
                )}
                {currentStepData?.visual?.type?.startsWith('subquery') && (
                  <SubqueryVisualizer step={currentStepData} />
                )}
                
                {/* DataTable */}
                <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                  <DataTable 
                    columns={(currentStepData.metadata as any)?.columns?.map((c: string) => ({ header: c, accessorKey: c })) || 
                             Object.keys(currentStepData.dataAfter?.[0] || currentStepData.dataBefore?.[0] || {}).map(c => ({ header: c, accessorKey: c }))} 
                    data={currentStepData.dataAfter || currentStepData.dataBefore || []} 
                    activeRowIndices={currentStepData.highlight?.rows}
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="h-24 border-t border-white/10 bg-zinc-900 px-8 flex items-center gap-8 rounded-b-2xl">
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

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <span>Timeline</span>
            <span>{Math.round((currentStep / (totalSteps - 1 || 1)) * 100)}%</span>
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
      </div>
    </div>
  );
}
