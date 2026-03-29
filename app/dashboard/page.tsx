import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays } from 'date-fns';
import { TOTAL_LESSONS } from '@/lib/constants';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { TeacherSidebar } from '@/components/dashboard/TeacherSidebar';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import {
  ActivityLineChart,
  TopicMasteryBarChart,
} from '@/components/dashboard/Charts';
import { ConsistencyHeatmap } from '@/components/dashboard/ConsistencyHeatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

async function getDashboardData() {
  const today = startOfDay(new Date());
  const startDate = subDays(today, 29);

  const [students, classes, activities, progressEntries] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'student' },
      include: {
        class: true,
        progress: true,
        activity: true,
      },
    }),
    prisma.class.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.activity.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        date: 'desc',
      },
    }),
    prisma.progress.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: true,
      },
      take: 120,
    }),
  ]);

  const totalStudents = students.length;
  const activeStudents = students.filter((student) =>
    student.activity.some((entry) => entry.date >= subDays(today, 7))
  ).length;
  const totalClasses = classes.length;
  const completedLessons = students.reduce(
    (sum, student) => sum + student.progress.filter((entry) => entry.completed).length,
    0
  );
  const avgProgress = totalStudents > 0 ? (completedLessons / (totalStudents * TOTAL_LESSONS)) * 100 : 0;

  const activityMap = new Map<string, number>();
  for (const activity of activities) {
    const key = activity.date.toISOString().split('T')[0];
    activityMap.set(key, (activityMap.get(key) ?? 0) + activity.actionsCount);
  }
  const activitySeries = Array.from(activityMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, count]) => ({ date, count }));

  const topicMap = new Map<string, { total: number; count: number }>();
  for (const entry of progressEntries) {
    const current = topicMap.get(entry.topic) ?? { total: 0, count: 0 };
    current.total += entry.score;
    current.count += 1;
    topicMap.set(entry.topic, current);
  }
  const topicMastery = Array.from(topicMap.entries())
    .map(([topic, value]) => ({
      topic,
      score: value.total / value.count,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);

  const recentActivity = [
    ...progressEntries
      .filter((entry) => entry.completed)
      .slice(0, 4)
      .map((entry) => ({
        id: `progress-${entry.id}`,
        title: `${entry.user.name} completed ${entry.topic}`,
        description: `Lesson ${entry.lessonId} was marked complete with a ${entry.score}% score.`,
        timestamp: entry.createdAt.toLocaleDateString(),
        tone: 'student' as const,
      })),
    ...classes.slice(0, 2).map((cls) => ({
      id: `class-${cls.id}`,
      title: `${cls.name} is trending upward`,
      description: `${cls._count.students} students are currently enrolled and contributing to class progress.`,
      timestamp: cls.createdAt.toLocaleDateString(),
      tone: 'class' as const,
    })),
  ].slice(0, 6);

  return {
    metrics: [
      {
        title: 'Total Students',
        value: totalStudents,
        description: 'All learners currently enrolled in QueryQuest.',
        icon: Users,
        accentClassName: 'text-sky-300',
      },
      {
        title: 'Active Students',
        value: activeStudents,
        description: 'Learners active during the last 7 days.',
        icon: TrendingUp,
        accentClassName: 'text-emerald-300',
      },
      {
        title: 'Total Classes',
        value: totalClasses,
        description: 'Teaching groups being tracked right now.',
        icon: BookOpen,
        accentClassName: 'text-violet-300',
      },
      {
        title: 'Avg Progress',
        value: `${avgProgress.toFixed(1)}%`,
        description: 'Average completed curriculum across students.',
        icon: Sparkles,
        accentClassName: 'text-amber-300',
      },
    ],
    classes: classes.slice(0, 4),
    activitySeries,
    topicMastery,
    heatmap: activitySeries,
    recentActivity,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="flex h-screen bg-[#020617] text-white">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-8 p-6">
          <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_38%),linear-gradient(135deg,#0f172a,#020617)] p-8 shadow-[0_30px_80px_rgba(2,6,23,0.65)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
                  Teacher Dashboard
                </div>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  A calm, focused control center for every class you run.
                </h1>
                <p className="mt-4 text-base leading-7 text-slate-300">
                  Track learner momentum, spot weak concepts early, and move from high-level
                  analytics into individual student detail in a couple of clicks.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/students"
                  className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-200 transition-all hover:bg-sky-500/15"
                >
                  Manage Students <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard/overview"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-200 transition-all hover:bg-white/[0.08]"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          </section>

          <OverviewCards items={data.metrics} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ActivityLineChart
                  data={data.activitySeries}
                  title="Student Activity Over Time"
                  description="Daily actions across the teacher workspace and student learning flow."
                />
                <TopicMasteryBarChart
                  data={data.topicMastery}
                  title="Topic Mastery"
                  description="Average topic scores across recent student submissions."
                />
              </div>

              <ConsistencyHeatmap
                data={data.heatmap}
                title="Daily Consistency"
                description="A GitHub-style activity view that makes engagement trends easy to spot."
              />
            </div>

            <ActivityFeed
              items={data.recentActivity}
              title="Recent Activity Feed"
              description="Student wins, class movement, and useful teaching signals."
            />
          </div>

          <Card className="border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                  <GraduationCap className="h-5 w-5 text-sky-300" />
                  Class Snapshots
                </CardTitle>
                <p className="mt-1 text-sm text-slate-400">
                  Quick access to the classes that need your attention.
                </p>
              </div>
              <Link href="/dashboard/class" className="text-sm font-medium text-sky-300 hover:text-sky-200">
                View all classes
              </Link>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {data.classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/dashboard/class/${cls.id}`}
                  className="group rounded-3xl border border-white/10 bg-[#0b1220] p-5 transition-all hover:border-sky-500/30 hover:bg-[#0e1728]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-white">{cls.name}</div>
                      <div className="mt-2 text-sm text-slate-400">
                        {cls._count.students} active students
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-600 transition-colors group-hover:text-sky-300" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
