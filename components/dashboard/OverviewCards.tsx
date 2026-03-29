'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, Target, CheckCircle } from 'lucide-react';

interface OverviewProps {
  totalStudents: number;
  activeToday: number;
  avgScore: number;
  avgCompletion: number;
}

export function OverviewCards({ totalStudents, activeToday, avgScore, avgCompletion }: OverviewProps) {
  const cards = [
    {
      title: 'Total Students',
      value: totalStudents,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Active Today',
      value: activeToday,
      icon: Activity,
      color: 'text-green-500',
    },
    {
      title: 'Avg. Score',
      value: `${avgScore.toFixed(1)}%`,
      icon: Target,
      color: 'text-purple-500',
    },
    {
      title: 'Avg. Completion',
      value: `${avgCompletion.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
