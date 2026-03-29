'use client';

import { useMemo } from 'react';
import { GitBranch } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { ExecutionStep } from '@/lib/executionEngine';
import type { VisualizerProps } from '@/components/visualizers/shared';

function resolveStep(provided?: ExecutionStep) {
  return provided;
}

export default function JoinVisualizer(props: VisualizerProps = {}) {
  const { lastExecutionSteps } = useAppStore();
  const step = useMemo(
    () =>
      resolveStep(props.step) ??
      [...lastExecutionSteps].reverse().find((entry) => entry.visual?.type === 'join'),
    [lastExecutionSteps, props.step]
  );

  if (!step?.visual || step.visual.type !== 'join') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
        No join step is active for the current context.
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr]">
      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Left Side</div>
        <div className="mt-2 text-lg font-semibold text-white">{step.visual.leftTable}</div>
        <div className="mt-4 space-y-2">
          {(step.visual.leftRows ?? []).map((row, index) => (
            <div
              key={`left-${index}`}
              className="rounded-xl border border-sky-500/20 bg-[#08101f] p-3 font-mono text-xs text-sky-100"
            >
              {JSON.stringify(row)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6">
        <GitBranch className="h-5 w-5 text-amber-300" />
        <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-200">
          {step.visual.matchingKeys?.join(' = ')}
        </div>
        <div className="text-xs text-zinc-500">{step.visual.joinType} JOIN</div>
        <div className="text-xs text-zinc-400">{step.visual.matches ?? 0} matches</div>
      </div>

      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">Right Side</div>
        <div className="mt-2 text-lg font-semibold text-white">{step.visual.rightTable}</div>
        <div className="mt-4 space-y-2">
          {(step.visual.rightRows ?? []).map((row, index) => (
            <div
              key={`right-${index}`}
              className="rounded-xl border border-violet-500/20 bg-[#12081b] p-3 font-mono text-xs text-violet-100"
            >
              {JSON.stringify(row)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
