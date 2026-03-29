'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivitySquare, GraduationCap, TrendingUp, UserCheck } from 'lucide-react';

export interface ActivityFeedItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tone?: 'student' | 'class' | 'insight';
}

const toneStyles = {
  student: {
    icon: UserCheck,
    className: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
  },
  class: {
    icon: GraduationCap,
    className: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  },
  insight: {
    icon: TrendingUp,
    className: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
  },
};

export function ActivityFeed({
  title = 'Recent Activity',
  description = 'Meaningful updates across students and classes.',
  items,
}: {
  title?: string;
  description?: string;
  items: ActivityFeedItem[];
}) {
  return (
    <Card className="border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
          <ActivitySquare className="h-5 w-5 text-sky-300" />
          {title}
        </CardTitle>
        <p className="text-sm text-slate-400">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length > 0 ? (
          items.map((item) => {
            const tone = toneStyles[item.tone ?? 'student'];
            const Icon = tone.icon;

            return (
              <div
                key={item.id}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className={`rounded-2xl border p-3 ${tone.className}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-medium text-white">{item.title}</p>
                    <span className="text-xs text-slate-500">{item.timestamp}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-500">
            Activity will appear here once learners start progressing through lessons.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
