'use client';

import DataTable from '@/components/DataTable';
import { getStepColumns, getStepRows, type VisualizerProps } from '@/components/visualizers/shared';

export default function FilterVisualizer({ step, previousStep }: VisualizerProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-white">Before Filter</div>
          <div className="text-xs text-zinc-500">{getStepRows(previousStep).length} rows</div>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <DataTable
            columns={getStepColumns(previousStep).map((column) => ({ header: column, accessorKey: column }))}
            data={getStepRows(previousStep)}
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-200">
          FILTER
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-white">After Filter</div>
          <div className="text-xs text-zinc-500">{getStepRows(step).length} rows</div>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-emerald-500/20">
          <DataTable
            columns={getStepColumns(step).map((column) => ({ header: column, accessorKey: column }))}
            data={getStepRows(step)}
          />
        </div>
      </div>
    </div>
  );
}
