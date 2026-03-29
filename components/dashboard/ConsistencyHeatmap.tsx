'use client';

import { format, startOfWeek, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivityPoint {
  date: string;
  count: number;
}

function getIntensity(count: number) {
  if (count === 0) return 'bg-white/[0.04]';
  if (count < 3) return 'bg-sky-950';
  if (count < 6) return 'bg-sky-800';
  if (count < 10) return 'bg-sky-600';
  return 'bg-sky-400';
}

export function ConsistencyHeatmap({
  data,
  title = 'Consistency Heatmap',
  description = 'A rolling 12-week view of student activity.',
}: {
  data: ActivityPoint[];
  title?: string;
  description?: string;
}) {
  const today = new Date();
  const start = startOfWeek(subDays(today, 83), { weekStartsOn: 1 });
  const days = Array.from({ length: 84 }, (_, index) => subDays(start, -index));
  const activityMap = new Map(data.map((entry) => [entry.date, entry.count]));
  const weeks = Array.from({ length: 12 }, (_, weekIndex) => days.slice(weekIndex * 7, weekIndex * 7 + 7));

  return (
    <Card className="border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
        <p className="text-sm text-slate-400">{description}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="overflow-x-auto">
          <div className="inline-flex gap-2">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-rows-7 gap-2">
                {week.map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const count = activityMap.get(key) ?? 0;

                  return (
                    <div
                      key={key}
                      title={`${key}: ${count} actions`}
                      className={`h-4 w-4 rounded-[6px] border border-white/5 ${getIntensity(count)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Low</span>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-[4px] bg-white/[0.04]" />
              <span className="h-3 w-3 rounded-[4px] bg-sky-950" />
              <span className="h-3 w-3 rounded-[4px] bg-sky-800" />
              <span className="h-3 w-3 rounded-[4px] bg-sky-600" />
              <span className="h-3 w-3 rounded-[4px] bg-sky-400" />
            </div>
            <span>High</span>
          </div>
          <span>Last 12 weeks</span>
        </div>
      </CardContent>
    </Card>
  );
}
