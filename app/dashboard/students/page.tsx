import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TOTAL_LESSONS } from '@/lib/constants';
import { calculateStreak } from '@/lib/analytics';
import { TeacherSidebar } from '@/components/dashboard/TeacherSidebar';
import { StudentsTable } from '@/components/dashboard/StudentsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

async function getStudents() {
  return prisma.user.findMany({
    where: {
      role: 'student',
    },
    include: {
      class: true,
      progress: true,
      activity: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export default async function StudentsPage() {
  const students = await getStudents();
  const rows = students.map((student) => {
    const completedCount = student.progress.filter((entry) => entry.completed).length;
    const progressPercent = (completedCount / TOTAL_LESSONS) * 100;
    const avgScore = student.progress.length > 0
      ? student.progress.reduce((sum, entry) => sum + entry.score, 0) / student.progress.length
      : 0;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      className: student.class?.name ?? 'Unassigned',
      progressPercent,
      avgScore,
      streak: calculateStreak(student.activity),
    };
  });
  const classOptions = Array.from(new Set(rows.map((row) => row.className))).sort();

  return (
    <div className="flex h-screen bg-[#020617] text-white">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-8 p-6">
          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#0f172a,#030712)] p-8 shadow-[0_30px_80px_rgba(2,6,23,0.6)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
                  Students
                </div>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                  Student performance at a glance
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                  Search by learner, filter by class, and jump directly into detailed analytics for
                  each student.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 text-right">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Total Students
                </div>
                <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-white">
                  <Users className="h-6 w-6 text-sky-300" />
                  {rows.length}
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-400">Average Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-white">
                  {rows.length > 0
                    ? `${(rows.reduce((sum, row) => sum + row.progressPercent, 0) / rows.length).toFixed(1)}%`
                    : '0%'}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-400">Average Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-white">
                  {rows.length > 0
                    ? `${(rows.reduce((sum, row) => sum + row.streak, 0) / rows.length).toFixed(1)} days`
                    : '0 days'}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-400">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-white">
                  {rows.length > 0
                    ? `${(rows.reduce((sum, row) => sum + row.avgScore, 0) / rows.length).toFixed(1)}%`
                    : '0%'}
                </div>
              </CardContent>
            </Card>
          </div>

          <StudentsTable rows={rows} classOptions={classOptions} />
        </div>
      </main>
    </div>
  );
}
