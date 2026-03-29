'use client';

import DataTable from '@/components/DataTable';
import { getStepColumns, getStepRows, type VisualizerProps } from '@/components/visualizers/shared';

export default function SubqueryVisualizer({ step }: VisualizerProps) {
  const query = step?.query ?? '';
  const nested = query.match(/\((\s*select[\s\S]+)\)/i)?.[1] ?? 'SELECT ...';

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-300">What</div>
        <p className="mt-3 text-sm leading-6 text-white">
          This step includes a nested query whose result must be resolved before the outer query can continue.
        </p>
        <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-300">Why</div>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          The outer query depends on the subquery output for filtering or comparison.
        </p>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-blue-500/20 bg-[#060b16] p-3 font-mono text-xs text-blue-100">
          {nested}
        </pre>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-sm font-semibold text-white">Subquery Result</div>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <DataTable
            columns={getStepColumns(step).map((column) => ({ header: column, accessorKey: column }))}
            data={getStepRows(step)}
          />
        </div>
      </div>
    </div>
  );
}
