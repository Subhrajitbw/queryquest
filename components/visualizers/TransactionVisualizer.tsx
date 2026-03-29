'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import type { ExecutionStep } from '@/lib/executionEngine';
import type { VisualizerProps } from '@/components/visualizers/shared';

export default function TransactionVisualizer(props: VisualizerProps = {}) {
  const { lastExecutionSteps } = useAppStore();
  const step = useMemo(
    () =>
      props.step ??
      [...lastExecutionSteps]
        .reverse()
        .find((entry) => entry.executionContext?.isTransaction),
    [lastExecutionSteps, props.step]
  );

  const context = step?.executionContext;
  const timeline = context?.isTransaction
    ? [
        'BEGIN transaction scope',
        ...(context.lockTargets?.length ? [`Lock ${context.lockTargets.join(', ')}`] : ['Lock affected relation']),
        `Execute ${step?.operation ?? 'current'} step`,
        ...(context.walEntries ?? []),
        step?.result.success ? 'COMMIT' : 'ROLLBACK',
      ]
    : [
        'Auto-commit mode',
        ...(context?.lockTargets?.length ? [`Lightweight lock on ${context.lockTargets.join(', ')}`] : []),
        `Execute ${step?.operation ?? 'current'} step`,
        'Implicit commit after statement success',
      ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-sm font-semibold text-white">Transactional Timeline</div>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        WHAT: the engine coordinates locks, logging, and commit behavior around the current step.
        <br />
        WHY: write safety depends on preserving order and recoverability, even when the query fails midway.
      </p>
      <div className="mt-4 space-y-3">
        {timeline.map((part, index) => (
          <div key={`${part}-${index}`} className="flex items-center gap-3">
            <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-200">
              {index + 1}
            </div>
            <div className="flex-1 rounded-2xl border border-white/10 bg-[#060b16] p-3 font-mono text-sm text-zinc-200">
              {part}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
