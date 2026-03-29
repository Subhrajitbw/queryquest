'use client';

import { DataTable } from '@/components/dashboard/DataTable';

export interface ClassStudentRow {
  id: string;
  name: string;
  email: string;
  progressPercent: number;
  avgScore: number;
}

export function ClassStudentsTable({ rows }: { rows: ClassStudentRow[] }) {
  return (
    <DataTable
      title="Student List"
      description="Drill into a learner for a deeper individual view."
      rows={rows}
      getRowKey={(row) => row.id}
      getRowHref={(row) => `/dashboard/student/${row.id}`}
      searchKeys={[(row) => row.name, (row) => row.email]}
      searchPlaceholder="Search students in this class"
      columns={[
        {
          key: 'student',
          header: 'Student',
          render: (row) => (
            <div>
              <div className="font-medium text-white">{row.name}</div>
              <div className="text-sm text-slate-500">{row.email}</div>
            </div>
          ),
        },
        {
          key: 'progress',
          header: 'Progress',
          render: (row) => (
            <div className="flex items-center gap-3">
              <div className="h-2 w-full max-w-[140px] overflow-hidden rounded-full bg-white/5">
                <div className="h-full bg-sky-400" style={{ width: `${row.progressPercent}%` }} />
              </div>
              <span className="text-sm font-medium text-white">{row.progressPercent.toFixed(0)}%</span>
            </div>
          ),
        },
        {
          key: 'score',
          header: 'Avg. Score',
          render: (row) => (
            <span className="text-sm font-medium text-white">{row.avgScore.toFixed(1)}%</span>
          ),
        },
      ]}
    />
  );
}
