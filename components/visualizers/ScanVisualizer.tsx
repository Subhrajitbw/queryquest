'use client';

import DataTable from '@/components/DataTable';
import { getStepColumns, getStepRows, type VisualizerProps } from '@/components/visualizers/shared';

export default function ScanVisualizer({ step }: VisualizerProps) {
  const rows = getStepRows(step).slice(0, 8);
  const tableName = step?.executionContext?.accessedTables[0] ?? step?.metadata?.table ?? 'table';

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">What</div>
        <p className="mt-3 text-sm leading-6 text-white">
          The engine is reading rows from <span className="font-mono text-cyan-200">{tableName}</span>.
        </p>
        <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Why</div>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          A scan creates the working set that later filters, joins, and sorts can transform.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-sm font-semibold text-white">Rows Being Read</div>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <DataTable
            columns={getStepColumns(step).map((column) => ({ header: column, accessorKey: column }))}
            data={rows}
          />
        </div>
      </div>
    </div>
  );
}
