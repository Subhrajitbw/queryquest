'use client';

import Link from 'next/link';
import { ChevronRight, Flame } from 'lucide-react';
import { DataTable, DataTableFilter } from '@/components/dashboard/DataTable';

export interface StudentRow {
  id: string;
  name: string;
  email: string;
  className: string;
  progressPercent: number;
  avgScore: number;
  streak: number;
}

export function StudentsTable({
  rows,
  classOptions,
}: {
  rows: StudentRow[];
  classOptions: string[];
}) {
  const filters: DataTableFilter<StudentRow>[] = [
    {
      key: 'class',
      label: 'Classes',
      allLabel: 'All classes',
      options: classOptions.map((className) => ({
        label: className,
        value: className,
        matches: (row) => row.className === className,
      })),
    },
  ];

  return (
    <DataTable
      title="Student Directory"
      description="A professional roster view with progress and habit signals."
      rows={rows}
      getRowKey={(row) => row.id}
      getRowHref={(row) => `/dashboard/student/${row.id}`}
      searchKeys={[(row) => row.name, (row) => row.email, (row) => row.className]}
      searchPlaceholder="Search students by name, email, or class"
      filters={filters}
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
          key: 'class',
          header: 'Class',
          render: (row) => <span className="text-sm text-slate-300">{row.className}</span>,
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
          key: 'streak',
          header: 'Streak',
          render: (row) => (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/15 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-200">
              <Flame className="h-4 w-4" />
              {row.streak} days
            </span>
          ),
        },
        {
          key: 'action',
          header: '',
          className: 'text-right',
          render: (row) => (
            <Link
              href={`/dashboard/student/${row.id}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 transition-colors hover:text-sky-200"
            >
              Open <ChevronRight className="h-4 w-4" />
            </Link>
          ),
        },
      ]}
    />
  );
}
