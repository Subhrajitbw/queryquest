import { prisma } from '@/lib/prisma';
import { TOTAL_LESSONS } from '@/lib/constants';
import { TeacherSidebar } from '@/components/dashboard/TeacherSidebar';
import { ClassStudentsTable } from '@/components/dashboard/ClassStudentsTable';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { PerformanceDistributionChart } from '@/components/dashboard/Charts';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Target, Users } from 'lucide-react';

async function getClassData(id: string) {
  const classData = await prisma.class.findUnique({
    where: { id },
    include: {
      students: {
        include: {
          progress: true,
        },
      },
    },
  });

  if (!classData) return null;

  const studentsAnalytics = classData.students.map(student => {
    const completedCount = student.progress.filter(p => p.completed).length;
    const avgScore = student.progress.length > 0
      ? student.progress.reduce((acc, p) => acc + p.score, 0) / student.progress.length
      : 0;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      progressPercent: (completedCount / TOTAL_LESSONS) * 100,
      avgScore,
    };
  });

  const totalStudents = classData.students.length;
  const classAvgProgress = totalStudents > 0
    ? studentsAnalytics.reduce((acc, s) => acc + s.progressPercent, 0) / totalStudents
    : 0;
  const classAvgScore = totalStudents > 0
    ? studentsAnalytics.reduce((acc, s) => acc + s.avgScore, 0) / totalStudents
    : 0;

  const distribution = [
    { range: '0-49', count: studentsAnalytics.filter((student) => student.avgScore < 50).length },
    { range: '50-69', count: studentsAnalytics.filter((student) => student.avgScore >= 50 && student.avgScore < 70).length },
    { range: '70-84', count: studentsAnalytics.filter((student) => student.avgScore >= 70 && student.avgScore < 85).length },
    { range: '85+', count: studentsAnalytics.filter((student) => student.avgScore >= 85).length },
  ];

  return {
    class: {
      id: classData.id,
      name: classData.name,
    },
    analytics: {
      totalStudents,
      avgProgress: classAvgProgress,
      avgScore: classAvgScore,
    },
    students: studentsAnalytics,
    distribution,
  };
}

export default async function ClassDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getClassData(id);

  if (!data) {
    return (
      <div className="flex h-screen bg-[#050505] text-white">
        <TeacherSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="p-8 text-center font-bold text-red-400">Class not found.</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-white">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-8 p-6">
          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#0f172a,#030712)] p-8 shadow-[0_30px_80px_rgba(2,6,23,0.6)]">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/class" className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-slate-400 transition-all hover:border-sky-500/50 hover:text-sky-300">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
                  Class Detail
                </div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                  {data.class.name}
                </h1>
                <p className="mt-2 text-base text-slate-300">
                  Review student performance, progress distribution, and class health at a glance.
                </p>
              </div>
            </div>
          </section>

          <OverviewCards
            items={[
              {
                title: 'Total Students',
                value: data.analytics.totalStudents,
                description: 'Learners currently assigned to this class.',
                icon: Users,
                accentClassName: 'text-sky-300',
              },
              {
                title: 'Avg. Progress',
                value: `${data.analytics.avgProgress.toFixed(1)}%`,
                description: 'Average curriculum completion across the class.',
                icon: CheckCircle,
                accentClassName: 'text-emerald-300',
              },
              {
                title: 'Avg. Score',
                value: `${data.analytics.avgScore.toFixed(1)}%`,
                description: 'Mean score across recorded student progress.',
                icon: Target,
                accentClassName: 'text-violet-300',
              },
            ]}
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Class Summary</CardTitle>
                <p className="text-sm text-slate-400">
                  A concise snapshot of how this class is performing right now.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-5">
                  <div className="text-sm text-slate-400">Students with strong momentum</div>
                  <div className="mt-2 text-3xl font-semibold text-white">
                    {data.students.filter((student) => student.progressPercent >= 70).length}
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-5">
                  <div className="text-sm text-slate-400">Students below 50% score</div>
                  <div className="mt-2 text-3xl font-semibold text-white">
                    {data.students.filter((student) => student.avgScore < 50).length}
                  </div>
                </div>
              </CardContent>
            </Card>

            <PerformanceDistributionChart
              data={data.distribution}
              title="Performance Distribution"
              description="Score bands across all students in this class."
            />
          </div>

          <ClassStudentsTable rows={data.students} />
        </div>
      </main>
    </div>
  );
}
