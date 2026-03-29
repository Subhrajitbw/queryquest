'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgressData {
  date: string;
  percent: number;
}

interface ActivityData {
  date: string;
  count: number;
}

interface MasteryData {
  topic: string;
  score: number;
}

export function ProgressLineChart({ data }: { data: ProgressData[] }) {
  return (
    <Card className="glass-card h-[400px]">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white">Progress Over Time</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} unit="%" />
            <Tooltip
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
              itemStyle={{ color: '#3b82f6' }}
            />
            <Line type="monotone" dataKey="percent" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ActivityBarChart({ data }: { data: ActivityData[] }) {
  return (
    <Card className="glass-card h-[400px]">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white">Daily Activity</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
              itemStyle={{ color: '#22c55e' }}
            />
            <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function MasteryRadarChart({ data }: { data: MasteryData[] }) {
  return (
    <Card className="glass-card h-[400px]">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white">Topic Mastery</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="topic" stroke="#888" fontSize={10} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#888" fontSize={10} />
            <Radar
              name="Mastery"
              dataKey="score"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.6}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
