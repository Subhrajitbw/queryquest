'use client';

import DataTable from '@/components/DataTable';
import { getStepColumns, getStepRows, type VisualizerProps } from '@/components/visualizers/shared';

export default function SortVisualizer({ step, previousStep }: VisualizerProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-sm font-semibold text-white">Order Before Sort</div>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <DataTable
            columns={getStepColumns(previousStep).map((column) => ({ header: column, accessorKey: column }))}
            data={getStepRows(previousStep)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="text-sm font-semibold text-white">Order After Sort</div>
        <div className="mt-4 overflow-hidden rounded-xl border border-amber-500/20">
          <DataTable
            columns={getStepColumns(step).map((column) => ({ header: column, accessorKey: column }))}
            data={getStepRows(step)}
          />
        </div>
      </div>
    </div>
  );
}
