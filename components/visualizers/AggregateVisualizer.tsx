'use client';

import { motion } from 'motion/react';
import DataTable from '@/components/DataTable';
import { getStepColumns, getStepRows, type VisualizerProps } from '@/components/visualizers/shared';

export default function AggregateVisualizer({ step }: VisualizerProps) {
  const rows = getStepRows(step);
  const bars = rows.slice(0, 6).map((row, index) => {
    const firstValue = Object.values(row)[0];
    const numericValue = Object.values(row).find((value) => typeof value === 'number');
    return {
      label: String(firstValue ?? `Group ${index + 1}`),
      value: typeof numericValue === 'number' ? numericValue : 1,
    };
  });
  const max = Math.max(...bars.map((item) => item.value), 1);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-sm font-semibold text-white">Aggregated Rows</div>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <DataTable
            columns={getStepColumns(step).map((column) => ({ header: column, accessorKey: column }))}
            data={rows}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="text-sm font-semibold text-white">Buckets Forming</div>
        <div className="mt-4 space-y-3">
          {bars.map((bar) => (
            <div key={bar.label}>
              <div className="mb-1 flex items-center justify-between gap-4 text-xs text-zinc-400">
                <span className="truncate">{bar.label}</span>
                <span>{bar.value}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(bar.value / max) * 100}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
