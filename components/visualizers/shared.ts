import type { ExecutionStep } from '@/lib/executionEngine';
import type { QueryAnalysis } from '@/lib/queryAnalyzer';

export type VisualizerProps = {
  step?: ExecutionStep;
  previousStep?: ExecutionStep;
  analysis?: QueryAnalysis;
};

export function getStepRows(step?: ExecutionStep) {
  return step?.result.rows ?? [];
}

export function getStepColumns(step?: ExecutionStep) {
  if (!step) return [];
  if (step.result.columns.length > 0) return step.result.columns;
  return Object.keys(step.result.rows[0] ?? {});
}
