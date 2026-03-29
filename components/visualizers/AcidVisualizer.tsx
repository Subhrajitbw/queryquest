'use client';

import { Lock } from 'lucide-react';
import type { VisualizerProps } from '@/components/visualizers/shared';

export default function AcidVisualizer({ step }: VisualizerProps) {
  const context = step?.executionContext;
  const properties = [
    {
      title: 'Atomicity',
      value: context?.isTransaction ? (step?.result.success ? 'Commit path intact' : 'Rollback path active') : 'Statement scope',
      description: step?.result.success
        ? 'The engine can treat the step as one all-or-nothing unit.'
        : 'Failure means partial writes must not remain visible.',
    },
    {
      title: 'Consistency',
      value: context?.consistencyCheck ?? 'Valid row shape preserved',
      description: 'Constraints and relational rules must remain valid before the next step proceeds.',
    },
    {
      title: 'Isolation',
      value: context?.lockTargets?.length ? `Locks on ${context.lockTargets.join(', ')}` : 'Minimal locking',
      description: 'The engine protects touched rows or tables from conflicting concurrent writes.',
    },
    {
      title: 'Durability',
      value: context?.durabilityTarget ?? 'Result stream only',
      description: 'Committed work is persisted through logging or durable page state before completion.',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {properties.map((property) => (
        <div key={property.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-white">
            <Lock className="h-4 w-4 text-sky-300" />
            <span className="font-semibold">{property.title}</span>
          </div>
          <div className="mt-3 text-sm font-medium text-sky-200">{property.value}</div>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{property.description}</p>
        </div>
      ))}
    </div>
  );
}
