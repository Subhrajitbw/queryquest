'use client';

import { getStepRows, type VisualizerProps } from '@/components/visualizers/shared';

function getCurrentFlowStage(stepOperation?: string) {
  switch (stepOperation) {
    case 'TABLE_SCAN':
      return 'FROM';
    case 'FILTER':
      return 'WHERE';
    case 'JOIN':
      return 'JOIN';
    case 'GROUP':
    case 'AGGREGATE':
      return 'GROUP BY';
    case 'PROJECT':
      return 'SELECT';
    case 'SORT':
      return 'ORDER BY';
    default:
      return 'SELECT';
  }
}

export default function FlowVisualizer({ step, analysis }: VisualizerProps) {
  const currentStage = getCurrentFlowStage(step?.operation);
  const flow = [
    { label: 'FROM', active: true },
    { label: 'WHERE', active: !!analysis?.hasWhere },
    { label: 'JOIN', active: !!analysis?.hasJoin },
    { label: 'GROUP BY', active: !!analysis?.hasGroupBy || !!analysis?.hasAggregation },
    { label: 'SELECT', active: true },
    { label: 'ORDER BY', active: !!analysis?.hasOrderBy },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          Query Flow
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          The anchor view for every step. It shows where the current frame sits in the SQL pipeline.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-6">
        {flow.map((item, index) => {
          const isCurrent = item.label === currentStage;
          return (
            <div key={item.label} className="relative">
              {index < flow.length - 1 && (
                <div className="absolute left-[calc(100%-4px)] top-1/2 hidden h-px w-2 -translate-y-1/2 bg-white/10 xl:block" />
              )}
              <div
                className={`rounded-2xl border p-4 ${
                  isCurrent
                    ? 'border-sky-500/30 bg-sky-500/10'
                    : item.active
                      ? 'border-white/10 bg-white/[0.03]'
                      : 'border-white/5 bg-white/[0.015] opacity-45'
                }`}
              >
                <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  {isCurrent ? 'Current' : item.active ? 'Used' : 'Skipped'}
                </div>
                <div className="mt-2 text-sm font-semibold text-white">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
        Current step rows: {getStepRows(step).length}
      </div>
    </div>
  );
}
