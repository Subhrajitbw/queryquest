import type { ExecutionStep } from '@/lib/executionEngine';

export type ExecutionTab =
  | 'flow'
  | 'scan'
  | 'filter'
  | 'join'
  | 'aggregate'
  | 'sort'
  | 'projection'
  | 'index'
  | 'subquery'
  | 'transaction'
  | 'acid';

export function getPrimaryTab(step: ExecutionStep | undefined): ExecutionTab {
  switch (step?.operation) {
    case 'TABLE_SCAN':
      return 'scan';
    case 'INDEX_SCAN':
      return 'index';
    case 'FILTER':
      return 'filter';
    case 'JOIN':
      return 'join';
    case 'GROUP':
    case 'AGGREGATE':
      return 'aggregate';
    case 'SORT':
      return 'sort';
    case 'PROJECT':
      return 'projection';
    case 'SUBQUERY':
      return 'subquery';
    case 'TRANSACTION':
      return 'transaction';
    default:
      return 'flow';
  }
}

export function getExecutionTabs(step: ExecutionStep | undefined): ExecutionTab[] {
  switch (step?.operation) {
    case 'TABLE_SCAN':
      return ['flow', 'scan'];
    case 'INDEX_SCAN':
      return ['flow', 'index'];
    case 'FILTER':
      return ['flow', 'filter'];
    case 'JOIN':
      return ['flow', 'join'];
    case 'GROUP':
    case 'AGGREGATE':
      return ['flow', 'aggregate'];
    case 'SORT':
      return ['flow', 'sort'];
    case 'PROJECT':
      return ['flow', 'projection'];
    case 'SUBQUERY':
      return ['flow', 'subquery'];
    case 'TRANSACTION':
      return ['flow', 'transaction', 'acid'];
    default:
      return ['flow'];
  }
}
