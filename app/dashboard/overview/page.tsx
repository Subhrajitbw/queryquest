import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays } from 'date-fns';
import { TOTAL_LESSONS } from '@/lib/constants';
import { TeacherSidebar } from '@/components/dashboard/TeacherSidebar';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { ActivityBarChart, ProgressLineChart } from '@/components/dashboard/Charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, TrendingUp } from 'lucide-react';

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

  return {
    overview: {
      totalStudents,
      activeToday,
      avgScore,
      avgCompletion,
    },
    dailyActivity,
    completionByDate,
    classSnapshots,
  };
}

export default async function DashboardOverviewPage() {
  const data = await getOverviewData();

  return (
    <div className="flex h-screen bg-[#050505] text-white">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.35em] text-blue-400">
                Teacher Workspace
              </div>
              <h1 className="mt-3 text-4xl font-black uppercase tracking-tighter text-white">
                Analytics Overview
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Track activity, completion, and recent class health from one place.
              </p>
            </div>
            <Link
              href="/dashboard/students"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 transition-all hover:bg-blue-500/15"
            >
              Review Students <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <OverviewCards {...data.overview} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <ActivityBarChart data={data.dailyActivity} />
            <ProgressLineChart data={data.completionByDate} />
          </div>

          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Recent Classes
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {data.classSnapshots.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/class/${item.id}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-blue-500/40 hover:bg-white/10"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Class
                  </div>
                  <div className="mt-3 text-lg font-bold text-white">{item.name}</div>
                  <div className="mt-2 text-sm text-slate-400">
                    {item._count.students} enrolled students
                  </div>
                </Link>
              ))}
              {data.classSnapshots.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
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
