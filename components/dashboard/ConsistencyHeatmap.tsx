'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

interface Activity {
  date: string;
  count: number;
}

export function ConsistencyHeatmap({ data }: { data: Activity[] }) {
  // Generate last 90 days
  const today = startOfDay(new Date());
  const days = Array.from({ length: 90 }, (_, i) => subDays(today, 89 - i));

  const getColor = (count: number) => {
    if (count === 0) return 'bg-white/5';
    if (count < 3) return 'bg-blue-900/40';
    if (count < 6) return 'bg-blue-700/60';
    if (count < 10) return 'bg-blue-500/80';
    return 'bg-blue-400';
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white">Consistency (Last 90 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const activity = data.find((a) => a.date === dateStr);
            const count = activity?.count || 0;

            return (
              <div
                key={dateStr}
                title={`${dateStr}: ${count} actions`}
                className={`w-3 h-3 rounded-sm ${getColor(count)} transition-colors`}
              />
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-white/5" />
            <span>Less</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-400" />
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
