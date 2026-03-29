import { prisma } from '@/lib/prisma';
import { differenceInDays } from 'date-fns';
import { TOTAL_LESSONS } from '@/lib/constants';
import { calculateStreak } from '@/lib/analytics';
import { TeacherSidebar } from '@/components/dashboard/TeacherSidebar';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Target, CheckCircle, Clock, Flame, Activity, AlertTriangle } from 'lucide-react';
import { ProgressLineChart, ActivityBarChart, MasteryRadarChart } from '@/components/dashboard/Charts';
import { ConsistencyHeatmap } from '@/components/dashboard/ConsistencyHeatmap';

async function getStudentData(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      progress: true,
      activity: true,
    },
  });

  if (!user) return null;

  const completedLessons = user.progress.filter(p => p.completed).length;
  const progressPercent = (completedLessons / TOTAL_LESSONS) * 100;

  const avgScore = user.progress.length > 0
    ? user.progress.reduce((acc, p) => acc + p.score, 0) / user.progress.length
    : 0;

  const activeDays = user.activity.length;
  const firstActivity = user.activity.sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  const totalDays = firstActivity 
    ? Math.max(1, differenceInDays(new Date(), firstActivity.date) + 1)
    : 1;
  const consistency = (activeDays / totalDays) * 100;

  const streak = calculateStreak(user.activity);

  const dailyActivity = user.activity.map(a => ({
    date: a.date.toISOString().split('T')[0],
    count: a.actionsCount,
  }));

  const topics = Array.from(new Set(user.progress.map(p => p.topic)));
  const topicMastery = topics.map(topic => {
    const topicProgress = user.progress.filter(p => p.topic === topic);
    const avg = topicProgress.reduce((acc, p) => acc + p.score, 0) / topicProgress.length;
    return { topic, score: avg };
  });

  const totalTimeSpent = user.progress.reduce((acc, p) => acc + p.timeSpent, 0);
  const weakTopics = topicMastery.filter(t => t.score < 50).map(t => t.topic);

  // Progress over time (completed lessons count over time)
  const progressOverTime = user.progress
    .filter(p => p.completed)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((p, index) => ({
      date: p.createdAt.toISOString().split('T')[0],
      percent: ((index + 1) / TOTAL_LESSONS) * 100,
    }));

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    analytics: {
      progressPercent,
      avgScore,
      consistency,
      streak,
      dailyActivity,
      topicMastery,
      totalTimeSpent,
      weakTopics,
      progressOverTime,
    },
  };
}

export default async function StudentDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getStudentData(id);

  if (!data) {
    return (
      <div className="flex h-screen bg-[#050505] text-white">
        <TeacherSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="p-8 text-center font-bold text-red-400">Student not found.</div>
        </main>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-all hover:border-blue-500/50 hover:text-blue-400">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase">{data.user.name} Analytics</h1>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Progress</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.analytics.progressPercent.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Avg. Score</CardTitle>
                <Target className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.analytics.avgScore.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Streak</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.analytics.streak} Days</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Time Spent</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatTime(data.analytics.totalTimeSpent)}</div>
              </CardContent>
            </Card>
          </div>

          {data.analytics.weakTopics.length > 0 && (
            <Card className="flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
              <div className="rounded-lg bg-red-500/20 p-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <div className="text-sm font-bold uppercase tracking-widest text-red-400">Weak Topics Identified</div>
                <div className="font-medium text-white">{data.analytics.weakTopics.join(', ')}</div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <ProgressLineChart data={data.analytics.progressOverTime} />
            <ActivityBarChart data={data.analytics.dailyActivity} />
            <MasteryRadarChart data={data.analytics.topicMastery} />
            <ConsistencyHeatmap data={data.analytics.dailyActivity} />
          </div>
        </div>
      </main>
    </div>
  );
}
