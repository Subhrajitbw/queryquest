import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays } from 'date-fns';
import { TOTAL_LESSONS } from '@/lib/constants';
import { TeacherSidebar } from '@/components/dashboard/TeacherSidebar';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import {
  ActivityLineChart,
  ProgressLineChart,
  TopicMasteryBarChart,
} from '@/components/dashboard/Charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, Sparkles, TrendingUp, Users } from 'lucide-react';

async function getOverviewData() {
  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 29);

  const [students, activities, completedProgress] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'student' },
      include: {
        progress: true,
      },
    }),
    prisma.activity.findMany({
      where: {
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        date: 'asc',
      },
    }),
    prisma.progress.findMany({
      where: {
        completed: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: true,
      },
    }),
  ]);

  const totalStudents = students.length;
  const activeToday = activities.filter((activity) => activity.date >= today).length;
  const totalScoreEntries = students.reduce((count, student) => count + student.progress.length, 0);
  const totalScore = students.reduce(
    (sum, student) => sum + student.progress.reduce((studentSum, entry) => studentSum + entry.score, 0),
    0
  );
  const avgScore = totalScoreEntries > 0 ? totalScore / totalScoreEntries : 0;
  const totalCompletedLessons = students.reduce(
    (sum, student) => sum + student.progress.filter((entry) => entry.completed).length,
    0
  );
  const avgCompletion = totalStudents > 0 ? (totalCompletedLessons / (totalStudents * TOTAL_LESSONS)) * 100 : 0;

  const activityByDate = new Map<string, number>();
  for (const activity of activities) {
    const key = activity.date.toISOString().split('T')[0];
    activityByDate.set(key, (activityByDate.get(key) ?? 0) + activity.actionsCount);
  }

  const dailyActivity = Array.from(activityByDate.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const completionByDate = completedProgress.reduce<Array<{ date: string; percent: number }>>((acc, entry, index) => {
    acc.push({
      date: entry.createdAt.toISOString().split('T')[0],
      percent: ((index + 1) / Math.max(1, totalStudents * TOTAL_LESSONS)) * 100,
    });
    return acc;
  }, []);

  const classSnapshots = await prisma.class.findMany({
    include: {
      _count: {
        select: {
          students: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 4,
  });

  const topicMasteryMap = new Map<string, { total: number; count: number }>();
  for (const student of students) {
    for (const entry of student.progress) {
      const current = topicMasteryMap.get(entry.topic) ?? { total: 0, count: 0 };
      current.total += entry.score;
      current.count += 1;
      topicMasteryMap.set(entry.topic, current);
    }
  }
  const topicMastery = Array.from(topicMasteryMap.entries())
    .map(([topic, value]) => ({
      topic,
      score: value.total / value.count,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);

  const recentActivity = completedProgress.slice(0, 5).map((entry) => ({
    id: entry.id,
    title: `${entry.user.name} lesson progress updated`,
    description: `${entry.topic} now contributes to completion analytics at ${entry.score}% mastery.`,
    timestamp: entry.createdAt.toLocaleDateString(),
    tone: 'insight' as const,
  }));

  return {
    overview: [
      {
        title: 'Total Students',
        value: totalStudents,
        description: 'Active students represented in analytics.',
        icon: Users,
        accentClassName: 'text-sky-300',
      },
      {
        title: 'Active Today',
        value: activeToday,
        description: 'Learners who generated activity today.',
        icon: TrendingUp,
        accentClassName: 'text-emerald-300',
      },
      {
        title: 'Avg. Score',
        value: `${avgScore.toFixed(1)}%`,
        description: 'Overall average score across tracked progress.',
        icon: Sparkles,
        accentClassName: 'text-violet-300',
      },
      {
        title: 'Avg. Completion',
        value: `${avgCompletion.toFixed(1)}%`,
        description: 'Curriculum completion rate across students.',
        icon: BookOpen,
        accentClassName: 'text-amber-300',
      },
    ],
    dailyActivity,
    completionByDate,
    classSnapshots,
    topicMastery,
    recentActivity,
  };
}

export default async function DashboardOverviewPage() {
  const data = await getOverviewData();

  return (
    <div className="flex h-screen bg-[#020617] text-white">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-8 p-6">
          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#0f172a,#030712)] p-8 shadow-[0_30px_80px_rgba(2,6,23,0.6)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
                  Analytics
                </div>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                  System-level performance signals for teachers
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                  Use this overview to track engagement, spot concept gaps, and quickly navigate to
                  the students or classes that need attention.
                </p>
              </div>
              <Link
                href="/dashboard/students"
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-200 transition-all hover:bg-sky-500/15"
              >
                Review Students <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <OverviewCards items={data.overview} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ActivityLineChart
              data={data.dailyActivity}
              title="Activity Over Time"
              description="A rolling view of student activity across recent days."
            />
            <ProgressLineChart
              data={data.completionByDate}
              title="Completion Velocity"
              description="How quickly completed lesson progress is accumulating."
            />
            <TopicMasteryBarChart
              data={data.topicMastery}
              title="Topic Mastery"
              description="Which concepts are strongest across the current cohort."
            />
            <ActivityFeed
              items={data.recentActivity}
              title="Analytics Notes"
              description="Recent inputs shaping the numbers on this page."
            />
          </div>

          <Card className="border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                <TrendingUp className="h-5 w-5 text-sky-300" />
                Recent Classes
              </CardTitle>
              <p className="text-sm text-slate-400">
                Jump into specific class dashboards from the latest active groups.
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {data.classSnapshots.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/class/${item.id}`}
                  className="rounded-3xl border border-white/10 bg-[#0b1220] p-5 transition-all hover:border-sky-500/30 hover:bg-[#0e1728]"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Class
                  </div>
                  <div className="mt-3 text-lg font-medium text-white">{item.name}</div>
                  <div className="mt-2 text-sm text-slate-400">
                    {item._count.students} enrolled students
                  </div>
                </Link>
              ))}
              {data.classSnapshots.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
                  No class analytics available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
