import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface OverviewCardItem {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  accentClassName?: string;
}

export function OverviewCards({ items }: { items: OverviewCardItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.title}
            className="border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(15,23,42,0.35)]"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">{item.title}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{item.description}</p>
                </div>
                <div
                  className={`rounded-2xl border border-white/10 bg-white/5 p-3 ${
                    item.accentClassName ?? 'text-blue-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
