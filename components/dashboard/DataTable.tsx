'use client';

import { useDeferredValue, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Primitive = string | number | null | undefined;

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

export interface DataTableFilter<T> {
  key: string;
  label: string;
  allLabel?: string;
  options: Array<{
    label: string;
    value: string;
    matches: (row: T) => boolean;
  }>;
}

export function DataTable<T>({
  title,
  description,
  rows,
  columns,
  getRowKey,
  getRowHref,
  searchKeys,
  searchPlaceholder = 'Search',
  filters = [],
  emptyState = 'No results found.',
}: {
  title?: string;
  description?: string;
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  getRowHref?: (row: T) => string;
  searchKeys: Array<(row: T) => Primitive>;
  searchPlaceholder?: string;
  filters?: DataTableFilter<T>[];
  emptyState?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      searchKeys.some((getValue) => String(getValue(row) ?? '').toLowerCase().includes(normalizedQuery));

    if (!matchesSearch) {
      return false;
    }

    return filters.every((filter) => {
      const selectedValue = activeFilters[filter.key];
      if (!selectedValue || selectedValue === 'all') {
        return true;
      }

      const selected = filter.options.find((option) => option.value === selectedValue);
      return selected ? selected.matches(row) : true;
    });
  });

  return (
    <Card className="border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
      <CardContent className="p-0">
        <div className="border-b border-white/10 px-6 py-5">
          {title ? <h2 className="text-lg font-semibold text-white">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
        </div>

        <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1220] py-3 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-500/50"
            />
          </div>

          {filters.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {filters.map((filter) => (
                <select
                  key={filter.key}
                  value={activeFilters[filter.key] ?? 'all'}
                  onChange={(event) =>
                    setActiveFilters((current) => ({
                      ...current,
                      [filter.key]: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-slate-200 outline-none transition-all focus:border-sky-500/50"
                >
                  <option value="all">{filter.allLabel ?? `All ${filter.label}`}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 ${column.className ?? ''}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredRows.map((row) => {
                const href = getRowHref?.(row);

                return (
                  <tr
                    key={getRowKey(row)}
                    onClick={href ? () => router.push(href) : undefined}
                    className={`transition-colors ${href ? 'cursor-pointer hover:bg-white/[0.03]' : ''}`}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className={`px-6 py-4 align-middle ${column.className ?? ''}`}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">{emptyState}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
