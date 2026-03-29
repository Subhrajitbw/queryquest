'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Database,
  HardDrive,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TableProperties,
  Workflow,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { buildExecutionSteps, type ExecutionStep, type Phase } from '@/lib/executionEngine';
import { getSchema } from '@/lib/db';
import { analyzeQuery } from '@/lib/queryAnalyzer';
import { getExecutionTabs, getPrimaryTab, type ExecutionTab } from '@/lib/visualizerConfig';
import DataTable from '@/components/DataTable';
import { useStepPlayer } from '@/hooks/useStepPlayer';
import StepControls from '@/components/StepControls';
import FlowVisualizer from '@/components/visualizers/FlowVisualizer';
import ScanVisualizer from '@/components/visualizers/ScanVisualizer';
import FilterVisualizer from '@/components/visualizers/FilterVisualizer';
import JoinVisualizer from '@/components/visualizers/JoinVisualizer';
import AggregateVisualizer from '@/components/visualizers/AggregateVisualizer';
import SortVisualizer from '@/components/visualizers/SortVisualizer';
import ProjectionVisualizer from '@/components/visualizers/ProjectionVisualizer';
import BTreeVisualizer from '@/components/visualizers/BTreeVisualizer';
import TransactionVisualizer from '@/components/visualizers/TransactionVisualizer';
import AcidVisualizer from '@/components/visualizers/AcidVisualizer';
import SubqueryVisualizer from '@/components/visualizers/SubqueryVisualizer';
import { getStepColumns, getStepRows } from '@/components/visualizers/shared';

type SchemaTable = {
  table: string;
  columns: { name: string; type: string }[];
};

type InsightTab = 'er' | 'security' | 'storage';

const PHASE_ICONS: Record<Phase, React.ReactNode> = {
  PARSE: <Search className="h-4 w-4 text-sky-300" />,
  VALIDATE: <Sparkles className="h-4 w-4 text-violet-300" />,
  PLAN: <Workflow className="h-4 w-4 text-indigo-300" />,
  ACCESS: <Database className="h-4 w-4 text-cyan-300" />,
  EXECUTE: <Workflow className="h-4 w-4 text-amber-300" />,
  RESULT: <TableProperties className="h-4 w-4 text-emerald-300" />,
  ERROR: <AlertCircle className="h-4 w-4 text-red-300" />,
};

function getRowsChanged(previousStep?: ExecutionStep, currentStep?: ExecutionStep) {
  const previousCount = getStepRows(previousStep).length;
  const currentCount = getStepRows(currentStep).length;

  if (!previousStep) {
    return 'This is the first frame in the execution story.';
  }

  if (currentCount === previousCount) {
    return `Row count stayed at ${currentCount}. The transformation changed interpretation more than size.`;
  }

  if (currentCount > previousCount) {
    return `Row count grew from ${previousCount} to ${currentCount}. This step expanded the working set.`;
  }

  return `Row count dropped from ${previousCount} to ${currentCount}. This step narrowed the working set.`;
}

function StepQueryBlock({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#060b16] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          Step Query
        </div>
        <div className="text-xs text-zinc-500">Readonly for continuity</div>
      </div>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm leading-6 text-zinc-200">
        {query}
      </pre>
    </div>
  );
}

function StepExplanation({ step }: { step?: ExecutionStep }) {
  if (!step?.explanation) return null;

  if (typeof step.explanation === 'string') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          Why This Step Exists
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{step.explanation}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-300">What</div>
        <p className="mt-3 text-sm leading-6 text-white">{step.explanation.what}</p>
      </div>
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300">Why</div>
        <p className="mt-3 text-sm leading-6 text-white">{step.explanation.why}</p>
      </div>
    </div>
  );
}

function ERInsightPanel({ schema }: { schema: SchemaTable[] }) {
  const relationships = schema.flatMap((table) =>
    table.columns
      .filter((column) => column.name.endsWith('_id'))
      .map((column) => {
        const base = column.name.replace(/_id$/, '');
        const related = schema.find((item) => item.table === `${base}s` || item.table === base);
        return related ? { from: table.table, to: related.table, label: column.name } : null;
      })
      .filter(Boolean) as { from: string; to: string; label: string }[]
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="grid gap-4 md:grid-cols-2">
        {schema.map((table) => (
          <div key={table.table} className="rounded-2xl border border-white/10 bg-[#060b16] p-4">
            <div className="text-sm font-semibold text-white">{table.table}</div>
            <div className="mt-3 space-y-2">
              {table.columns.map((column) => (
                <div key={column.name} className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-zinc-300">{column.name}</span>
                  <span className="font-mono text-zinc-500">{column.type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-sm font-semibold text-white">Relationships</div>
        <div className="mt-4 space-y-3">
          {relationships.map((relationship) => (
            <div key={`${relationship.from}-${relationship.to}-${relationship.label}`} className="rounded-2xl border border-white/10 bg-[#060b16] p-3">
              <div className="flex items-center gap-2 text-sm text-zinc-200">
                <span>{relationship.from}</span>
                <ChevronRight className="h-4 w-4 text-zinc-600" />
                <span>{relationship.to}</span>
              </div>
              <div className="mt-2 text-xs text-zinc-500">via {relationship.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecurityInsightPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
        <div className="flex items-center gap-2 text-red-300">
          <ShieldAlert className="h-4 w-4" />
          <span className="font-semibold">Unsafe Query Pattern</span>
        </div>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm text-red-100">
          {"SELECT * FROM users WHERE email = '<input>' OR '1'='1';"}
        </pre>
        <p className="mt-4 text-sm leading-6 text-red-100">
          WHAT: user input changes the SQL logic.
          <br />
          WHY: the condition can become always true and bypass intended filtering.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-semibold">Safe Query Pattern</span>
        </div>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm text-emerald-100">
          SELECT * FROM users WHERE email = ?;
        </pre>
        <p className="mt-4 text-sm leading-6 text-emerald-100">
          WHAT: SQL structure stays fixed and values are bound separately.
          <br />
          WHY: the database treats input as data, not executable SQL.
        </p>
      </div>
    </div>
  );
}

function StorageInsightPanel() {
  const storageFrames = [
    { title: 'Disk Pages', description: 'Rows live on disk in pages before the engine touches them.' },
    { title: 'Buffer Pool', description: 'Frequently accessed pages are pulled into memory to avoid repeated disk reads.' },
    { title: 'Execution', description: 'The planner reads from memory when possible, then applies filters, joins, and sorts.' },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {storageFrames.map((frame, index) => (
        <div key={frame.title} className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          {index < storageFrames.length - 1 && (
            <ArrowRight className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-zinc-700 xl:block" />
          )}
          <div className="flex items-center gap-2 text-white">
            <HardDrive className="h-4 w-4 text-cyan-300" />
            <span className="font-semibold">{frame.title}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{frame.description}</p>
        </div>
      ))}
    </div>
  );
}

function renderExecutionVisualizer(
  tab: ExecutionTab,
  step: ExecutionStep,
  previousStep: ExecutionStep | undefined,
  analysis: ReturnType<typeof analyzeQuery>
) {
  const props = { step, previousStep, analysis };

  switch (tab) {
    case 'flow':
      return <FlowVisualizer {...props} />;
    case 'scan':
      return <ScanVisualizer {...props} />;
    case 'filter':
      return <FilterVisualizer {...props} />;
    case 'join':
      return <JoinVisualizer {...props} />;
    case 'aggregate':
      return <AggregateVisualizer {...props} />;
    case 'sort':
      return <SortVisualizer {...props} />;
    case 'projection':
      return <ProjectionVisualizer {...props} />;
    case 'index':
      return <BTreeVisualizer {...props} />;
    case 'subquery':
      return <SubqueryVisualizer {...props} />;
    case 'transaction':
      return <TransactionVisualizer {...props} />;
    case 'acid':
      return <AcidVisualizer {...props} />;
    default:
      return <FlowVisualizer {...props} />;
  }
}

export default function QueryVisualizer() {
  const { lastExecutedQuery } = useAppStore();
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [executionTab, setExecutionTab] = useState<ExecutionTab>('flow');
  const [insightTab, setInsightTab] = useState<InsightTab>('er');

  useEffect(() => {
    async function generateSteps() {
      if (!lastExecutedQuery) return;

      setIsLoading(true);
      setError(null);
      try {
        setSteps(await buildExecutionSteps(lastExecutedQuery));
      } catch (err) {
        console.error(err);
        setError('Failed to analyze query execution.');
      } finally {
        setIsLoading(false);
      }
    }

    generateSteps();
  }, [lastExecutedQuery]);

  useEffect(() => {
    async function loadSchema() {
      setSchema(await getSchema());
    }

    loadSchema();
  }, []);

  const player = useStepPlayer(steps, 1500 / speed);
  const { currentStep, totalSteps, isPlaying, play, pause, next, prev, reset, goToStep, currentStepData } = player;
  const previousStep = currentStep > 0 ? steps[currentStep - 1] : undefined;

  const analysis = useMemo(
    () => analyzeQuery(currentStepData?.query ?? ''),
    [currentStepData?.query]
  );

  const concepts = useMemo(() => {
    if (!currentStepData) return [];

    const nextConcepts = [currentStepData.operation, currentStepData.phase].filter(Boolean) as string[];
    if (analysis.hasJoin) nextConcepts.push('JOIN');
    if (analysis.hasWhere) nextConcepts.push('FILTER');
    if (analysis.hasAggregation || analysis.hasGroupBy) nextConcepts.push('GROUP');
    if (analysis.hasOrderBy) nextConcepts.push('SORT');
    if (currentStepData.executionContext?.accessType === 'INDEX_SCAN') nextConcepts.push('INDEX');
    if (currentStepData.executionContext?.isTransaction || analysis.isWriteOperation) nextConcepts.push('TXN');
    if (currentStepData.executionContext?.isTransaction || analysis.isWriteOperation) nextConcepts.push('ACID');

    return Array.from(new Set(nextConcepts));
  }, [analysis, currentStepData]);

  const executionTabs = useMemo(() => getExecutionTabs(currentStepData), [currentStepData]);

  useEffect(() => {
    if (!currentStepData) return;
    setExecutionTab(getPrimaryTab(currentStepData));
  }, [currentStepData]);

  if (!lastExecutedQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-white/5 p-4">
          <Database className="h-12 w-12 text-zinc-500" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-white">No Query Executed</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
          Run a query in the playground first, then return here to inspect it frame by frame.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-500/20 border-t-sky-500" />
        <p className="text-zinc-400">Preparing execution frames...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-red-500/10 p-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-white">Analysis Failed</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">{error}</p>
      </div>
    );
  }

  if (!currentStepData) return null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_36%),linear-gradient(135deg,#0f172a,#020617)] p-6 shadow-[0_28px_80px_rgba(2,6,23,0.62)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-300">Step-Based Query Engine</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              See one SQL transformation at a time.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
              Each frame shows what changed, what the data looks like now, and why that transformation happened.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Step</div>
              <div className="mt-2 text-2xl font-semibold text-white">{currentStep + 1}/{totalSteps}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Rows</div>
              <div className="mt-2 text-2xl font-semibold text-white">{getStepRows(currentStepData).length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Phase</div>
              <div className="mt-2 text-2xl font-semibold text-white">{currentStepData.phase}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Playback</div>
              <div className="mt-2 text-sm font-semibold text-white">{isPlaying ? 'Autoplaying' : 'Manual'}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-[#07101c] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.5)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  {PHASE_ICONS[currentStepData.phase]}
                  <span>Step {currentStep + 1}</span>
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                  <span className="text-white">{currentStepData.title}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{currentStepData.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {concepts.map((concept) => (
                  <span
                    key={concept}
                    className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">What Changed</div>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{getRowsChanged(previousStep, currentStepData)}</p>
            </div>

            <div className="mt-5">
              <StepQueryBlock query={currentStepData.query} />
            </div>

            <div className="mt-5">
              <StepExplanation step={currentStepData} />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#07101c] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.5)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Result Table</div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">This is the row set produced by the current frame.</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <DataTable
                columns={getStepColumns(currentStepData).map((column) => ({ header: column, accessorKey: column }))}
                data={getStepRows(currentStepData)}
                activeRowIndices={currentStepData.highlight?.rows}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-[#050913] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.5)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Query Execution</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Visuals for this step only</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Tabs below are derived only from the current step operation.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {executionTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setExecutionTab(tab)}
                    className={`rounded-2xl border px-4 py-2 text-sm transition-colors ${
                      executionTab === tab
                        ? 'border-sky-500/30 bg-sky-500/10 text-white'
                        : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentStep}-${executionTab}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  {renderExecutionVisualizer(executionTab, currentStepData, previousStep, analysis)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#050913] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.5)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Database Insights</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Stable context around the query</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  These insights do not change per step. They help learners connect execution frames back to the database itself.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'er', label: 'ER Diagram' },
                  { id: 'security', label: 'Security' },
                  { id: 'storage', label: 'Storage' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setInsightTab(tab.id as InsightTab)}
                    className={`rounded-2xl border px-4 py-2 text-sm transition-colors ${
                      insightTab === tab.id
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-white'
                        : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={insightTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {insightTab === 'er' && <ERInsightPanel schema={schema} />}
                  {insightTab === 'security' && <SecurityInsightPanel />}
                  {insightTab === 'storage' && <StorageInsightPanel />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#07101c] p-4 shadow-[0_20px_60px_rgba(2,6,23,0.45)]">
        <div className="mb-4 flex items-center justify-between gap-4 px-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Step Controls</div>
            <p className="mt-1 text-sm text-zinc-400">The execution story stays under the user&apos;s control.</p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
            <span className="text-xs text-zinc-500">Speed</span>
            {([0.75, 1, 1.5] as const).map((value) => (
              <button
                key={value}
                onClick={() => setSpeed(value)}
                className={`rounded-full px-2 py-1 text-xs ${speed === value ? 'bg-sky-500/20 text-sky-200' : 'text-zinc-500'}`}
              >
                {value}x
              </button>
            ))}
          </div>
        </div>

        <StepControls
          currentStep={currentStep}
          totalSteps={totalSteps}
          isPlaying={isPlaying}
          onPlay={play}
          onPause={pause}
          onNext={next}
          onPrev={prev}
          onReset={reset}
          onSeek={goToStep}
        />
      </section>
    </div>
  );
}
