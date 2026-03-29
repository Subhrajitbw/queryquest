import { prisma } from '@/lib/prisma';
import { differenceInDays } from 'date-fns';
import { TOTAL_LESSONS } from '@/lib/constants';
import { calculateStreak } from '@/lib/analytics';
import { TeacherSidebar } from '@/components/dashboard/TeacherSidebar';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Clock, Flame, Target } from 'lucide-react';
import { ProgressLineChart, ActivityBarChart, TopicMasteryBarChart } from '@/components/dashboard/Charts';
import { ConsistencyHeatmap } from '@/components/dashboard/ConsistencyHeatmap';

async function getStudentData(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      progress: true,
      activity: true,
      class: true,
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
  const recentActivity = user.progress
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map((entry) => ({
      id: entry.id,
      title: `${entry.topic} lesson updated`,
      description: `${entry.completed ? 'Completed' : 'Attempted'} lesson ${entry.lessonId} with a ${entry.score}% score.`,
      timestamp: entry.createdAt.toLocaleDateString(),
      tone: 'student' as const,
    }));

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
      className: user.class?.name ?? 'Unassigned',
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
      recentActivity,
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
    <div className="flex h-screen bg-[#020617] text-white">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-8 p-6">
          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#0f172a,#030712)] p-8 shadow-[0_30px_80px_rgba(2,6,23,0.6)]">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/students" className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-slate-400 transition-all hover:border-sky-500/50 hover:text-sky-300">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
                  Student Detail
                </div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                  {data.user.name}
                </h1>
                <p className="mt-2 text-base text-slate-300">
                  {data.user.email} · {data.user.className}
                </p>
              </div>
            </div>
          </section>

          <OverviewCards
            items={[
              {
                title: 'Progress',
                value: `${data.analytics.progressPercent.toFixed(1)}%`,
                description: 'Overall curriculum completion for this learner.',
                icon: CheckCircle,
                accentClassName: 'text-sky-300',
              },
              {
                title: 'Average Score',
                value: `${data.analytics.avgScore.toFixed(1)}%`,
                description: 'Mean score across all tracked progress attempts.',
                icon: Target,
                accentClassName: 'text-violet-300',
              },
              {
                title: 'Streak',
                value: `${data.analytics.streak} days`,
                description: 'Current learning streak based on daily activity.',
                icon: Flame,
                accentClassName: 'text-amber-300',
              },
              {
                title: 'Time Spent',
                value: formatTime(data.analytics.totalTimeSpent),
                description: 'Total time invested in lessons so far.',
                icon: Clock,
                accentClassName: 'text-emerald-300',
              },
            ]}
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="grid grid-cols-1 gap-6">
              <ProgressLineChart
                data={data.analytics.progressOverTime}
                title="Performance Trends"
                description="How this student's completion rate is changing over time."
              />
              <TopicMasteryBarChart
                data={data.analytics.topicMastery}
                title="Topic Mastery"
                description="A topic-by-topic view of current strengths and weak spots."
              />
            </div>
            <div className="space-y-6">
              <ActivityFeed
                items={data.analytics.recentActivity}
                title="Recent Activity"
                description="The latest progress events for this student."
              />
              <Card className="border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
                <CardContent className="space-y-4 p-6">
                  <div>
                    <div className="text-sm font-medium text-slate-400">Learning Consistency</div>
                    <div className="mt-2 text-3xl font-semibold text-white">
                      {data.analytics.consistency.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-400">Focus Areas</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.analytics.weakTopics.length > 0 ? (
                        data.analytics.weakTopics.map((topic) => (
                          <span
                            key={topic}
                            className="rounded-full border border-amber-500/15 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-200"
                          >
                            {topic}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-200">
                          No weak topics detected
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
                <CardContent className="p-6">
                  <div className="text-sm font-medium text-slate-400">Progress Breakdown</div>
                  <div className="mt-4 space-y-4">
                    {data.analytics.topicMastery.map((topic) => (
                      <div key={topic.topic}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white">{topic.topic}</span>
                          <span className="text-slate-400">{topic.score.toFixed(0)}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                          <div className="h-full bg-sky-400" style={{ width: `${topic.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ActivityBarChart
              data={data.analytics.dailyActivity}
              title="Daily Activity"
              description="Actions completed by day."
            />
            <ConsistencyHeatmap
              data={data.analytics.dailyActivity}
              title="Consistency"
              description="A compact heatmap of this student's activity cadence."
            />
          </div>
        </div>
      </main>
    </div>
  );
}
