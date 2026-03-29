import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TeacherSidebar } from '@/components/dashboard/TeacherSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, GraduationCap, Users } from 'lucide-react';

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
    <div className="flex h-screen bg-[#050505] text-white">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.35em] text-blue-400">
              Teacher Workspace
            </div>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tighter text-white">
              Classes
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Review every class, see current enrollment, and jump into detailed analytics.
            </p>
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
                <Card key={cls.id} className="glass-card border border-white/10">
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                        <GraduationCap className="h-5 w-5 text-blue-400" />
                        {cls.name}
                      </CardTitle>
                      <p className="mt-2 text-sm text-slate-400">
                        Created {cls.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/class/${cls.id}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-blue-300 transition-all hover:bg-blue-500/15"
                    >
                      Open <ChevronRight className="h-4 w-4" />
                    </Link>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Students
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-2xl font-bold text-white">
                        <Users className="h-5 w-5 text-green-400" />
                        {cls._count.students}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Avg. Score
                      </div>
                      <div className="mt-3 text-2xl font-bold text-white">
                        {avgScore.toFixed(1)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {classes.length === 0 && (
            <Card className="glass-card border border-white/10">
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
