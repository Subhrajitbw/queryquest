'use client';

import DataTable from '@/components/DataTable';
import { getStepColumns, getStepRows, type VisualizerProps } from '@/components/visualizers/shared';

export default function ProjectionVisualizer({ step, previousStep }: VisualizerProps) {
  const beforeColumns = getStepColumns(previousStep);
  const afterColumns = getStepColumns(step);
  const removedColumns = beforeColumns.filter((column) => !afterColumns.includes(column));

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-fuchsia-300">What</div>
        <p className="mt-3 text-sm leading-6 text-white">
          Projection keeps only the columns requested by this step query.
        </p>
        <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-fuchsia-300">Why</div>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          Returning fewer columns makes the result easier to read and keeps irrelevant data out of the output.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {afterColumns.map((column) => (
            <span
              key={column}
              className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-mono text-fuchsia-100"
            >
              {column}
            </span>
          ))}
          {removedColumns.map((column) => (
            <span
              key={`removed-${column}`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-mono text-zinc-500 line-through"
            >
              {column}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-sm font-semibold text-white">Projected Result</div>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <DataTable
            columns={afterColumns.map((column) => ({ header: column, accessorKey: column }))}
            data={getStepRows(step)}
          />
        </div>
      </div>
    </div>
  );
}
