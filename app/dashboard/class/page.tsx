import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TeacherSidebar } from '@/components/dashboard/TeacherSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ChevronRight, GraduationCap, Users } from 'lucide-react';

async function getClasses() {
  return prisma.class.findMany({
    include: {
      _count: {
        select: { students: true },
      },
      students: {
        include: {
          progress: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export default async function ClassesPage() {
  const classes = await getClasses();

  return (
    <div className="flex h-screen bg-[#020617] text-white">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-8 p-6">
          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#0f172a,#030712)] p-8 shadow-[0_30px_80px_rgba(2,6,23,0.6)]">
            <div className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
              Classes
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Keep every class organized and measurable
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
              Compare groups, review performance health, and open class-specific dashboards for a
              closer look.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-400">Total Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-white">{classes.length}</div>
              </CardContent>
            </Card>
            <Card className="border border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-400">Total Enrollment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-white">
                  {classes.reduce((sum, cls) => sum + cls._count.students, 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-400">Avg. Class Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-white">
                  {classes.length > 0
                    ? `${(
                        classes.reduce((sum, cls) => {
                          const scores = cls.students.flatMap((student) => student.progress.map((progress) => progress.score));
                          const average = scores.length > 0
                            ? scores.reduce((scoreSum, score) => scoreSum + score, 0) / scores.length
                            : 0;
                          return sum + average;
                        }, 0) / classes.length
                      ).toFixed(1)}%`
                    : '0%'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {classes.map((cls) => {
              const totalScoreEntries = cls.students.reduce((count, student) => count + student.progress.length, 0);
              const totalScore = cls.students.reduce(
                (sum, student) => sum + student.progress.reduce((studentSum, progress) => studentSum + progress.score, 0),
                0
              );
              const avgScore = totalScoreEntries > 0 ? totalScore / totalScoreEntries : 0;

              return (
                <Card key={cls.id} className="border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
                        <GraduationCap className="h-5 w-5 text-sky-300" />
                        {cls.name}
                      </CardTitle>
                      <p className="mt-2 text-sm text-slate-400">
                        Created {cls.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/class/${cls.id}`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-200 transition-all hover:bg-sky-500/15"
                    >
                      Open <ChevronRight className="h-4 w-4" />
                    </Link>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Students
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-2xl font-semibold text-white">
                        <Users className="h-5 w-5 text-sky-300" />
                        {cls._count.students}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Avg. Score
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-white">
                        {avgScore.toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Coverage
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-2xl font-semibold text-white">
                        <BarChart3 className="h-5 w-5 text-emerald-300" />
                        {totalScoreEntries}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {classes.length === 0 && (
            <Card className="border border-white/10 bg-white/[0.03]">
              <CardContent className="py-12 text-center text-slate-400">
                No classes found yet.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
