'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivityPoint {
  date: string;
  count: number;
}

interface ProgressPoint {
  date: string;
  percent: number;
}

interface MasteryPoint {
  topic: string;
  score: number;
}

interface DistributionPoint {
  range: string;
  count: number;
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
        {description ? <p className="text-sm text-slate-400">{description}</p> : null}
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ActivityLineChart({
  data,
  title = 'Student Activity',
  description = 'Daily engagement across the learning platform.',
}: {
  data: ActivityPoint[];
  title?: string;
  description?: string;
}) {
  return (
    <ChartCard title={title} description={description}>
      <LineChart data={data}>
        <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.14)" />
        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ stroke: 'rgba(59, 130, 246, 0.35)', strokeWidth: 1 }}
          contentStyle={{
            backgroundColor: '#020617',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: '16px',
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#60a5fa"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5, fill: '#bfdbfe' }}
        />
      </LineChart>
    </ChartCard>
  );
}

export function TopicMasteryBarChart({
  data,
  title = 'Topic Mastery',
  description = 'Average performance by concept area.',
}: {
  data: MasteryPoint[];
  title?: string;
  description?: string;
}) {
  return (
    <ChartCard title={title} description={description}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
        <CartesianGrid horizontal={false} stroke="rgba(148, 163, 184, 0.14)" />
        <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="topic"
          stroke="#94a3b8"
          width={90}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          contentStyle={{
            backgroundColor: '#020617',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: '16px',
          }}
        />
        <Bar dataKey="score" radius={[0, 10, 10, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.topic}
              fill={entry.score >= 80 ? '#38bdf8' : entry.score >= 60 ? '#60a5fa' : '#334155'}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartCard>
  );
}

export function PerformanceDistributionChart({
  data,
  title = 'Performance Distribution',
  description = 'How learners are spread across score bands.',
}: {
  data: DistributionPoint[];
  title?: string;
  description?: string;
}) {
  return (
    <ChartCard title={title} description={description}>
      <BarChart data={data}>
        <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.14)" />
        <XAxis dataKey="range" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          contentStyle={{
            backgroundColor: '#020617',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: '16px',
          }}
        />
        <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#60a5fa" />
      </BarChart>
    </ChartCard>
  );
}

export function ProgressLineChart({
  data,
  title = 'Performance Trends',
  description = 'Completion progression over time.',
}: {
  data: ProgressPoint[];
  title?: string;
  description?: string;
}) {
  return (
    <ChartCard title={title} description={description}>
      <LineChart data={data}>
        <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.14)" />
        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          unit="%"
        />
        <Tooltip
          cursor={{ stroke: 'rgba(59, 130, 246, 0.35)', strokeWidth: 1 }}
          contentStyle={{
            backgroundColor: '#020617',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: '16px',
          }}
        />
        <Line
          type="monotone"
          dataKey="percent"
          stroke="#38bdf8"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5, fill: '#e0f2fe' }}
        />
      </LineChart>
    </ChartCard>
  );
}

export function ActivityBarChart({
  data,
  title = 'Daily Activity',
  description = 'Interaction volume by day.',
}: {
  data: ActivityPoint[];
  title?: string;
  description?: string;
}) {
  return (
    <ChartCard title={title} description={description}>
      <BarChart data={data}>
        <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.14)" />
        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          contentStyle={{
            backgroundColor: '#020617',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: '16px',
          }}
        />
        <Bar dataKey="count" fill="#60a5fa" radius={[10, 10, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}

export function MasteryRadarChart({
  data,
  title = 'Topic Coverage',
  description = 'Relative balance across all mastered concepts.',
}: {
  data: MasteryPoint[];
  title?: string;
  description?: string;
}) {
  return (
    <ChartCard title={title} description={description}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="rgba(148, 163, 184, 0.18)" />
        <PolarAngleAxis dataKey="topic" stroke="#94a3b8" fontSize={11} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={10} />
        <Radar name="Score" dataKey="score" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.35} />
        <Legend />
      </RadarChart>
    </ChartCard>
  );
}
