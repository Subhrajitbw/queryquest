'use client';

import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { ExecutionStep } from '@/lib/executionEngine';
import type { VisualizerProps } from '@/components/visualizers/shared';

export default function BTreeVisualizer(props: VisualizerProps = {}) {
  const { lastExecutionSteps } = useAppStore();
  const step = useMemo(
    () =>
      props.step ??
      [...lastExecutionSteps]
        .reverse()
        .find((entry) => entry.executionContext?.accessType === 'INDEX_SCAN'),
    [lastExecutionSteps, props.step]
  );

  const context = step?.executionContext;
  const lookupColumn = context?.indexColumn ?? context?.filterColumn ?? 'id';
  const lookupValue = context?.filterValue ?? '?';
  const comparisons = context?.comparisons ?? [];

  if (!context || context.accessType !== 'INDEX_SCAN') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
        No index scan is active for the current context.
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">What</div>
        <p className="mt-3 text-sm leading-6 text-white">
          The step is using
          <span className="mx-1 font-mono text-cyan-200">{context.accessType}</span>
          on
          <span className="mx-1 font-mono text-cyan-200">{lookupColumn}</span>
          with lookup value
          <span className="mx-1 font-mono text-cyan-200">{String(lookupValue)}</span>.
        </p>
        <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Why</div>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          A B-Tree narrows the search by comparing ordered keys until the engine reaches the correct leaf range.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-sm font-semibold text-white">Traversal Path</div>
        <div className="mt-4 space-y-3">
          {['Root page', ...comparisons, `Leaf match resolves ${String(lookupValue)}`].map((label) => (
            <div key={label} className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                <Search className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="flex-1 rounded-2xl border border-white/10 bg-[#060b16] p-3 text-sm text-zinc-200">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
