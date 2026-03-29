import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TOTAL_LESSONS } from '@/lib/constants';
import { TeacherSidebar } from '@/components/dashboard/TeacherSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Search, Users } from 'lucide-react';

async function getStudents() {
  return prisma.user.findMany({
    where: {
      role: 'student',
    },
    include: {
      class: true,
      progress: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export default async function StudentsPage() {
  const students = await getStudents();

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
                Students
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Browse the full student roster and drill into individual analytics.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Total Students
              </div>
              <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
                <Users className="h-5 w-5 text-blue-400" />
                {students.length}
              </div>
            </div>
          </div>

          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <Search className="h-5 w-5 text-blue-400" />
                Student Directory
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Student</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Class</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Progress</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Avg. Score</th>
                      <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {students.map((student) => {
                      const completedCount = student.progress.filter((entry) => entry.completed).length;
                      const progressPercent = (completedCount / TOTAL_LESSONS) * 100;
                      const avgScore = student.progress.length > 0
                        ? student.progress.reduce((sum, entry) => sum + entry.score, 0) / student.progress.length
                        : 0;

                      return (
                        <tr key={student.id} className="transition-colors hover:bg-white/5">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{student.name}</div>
                            <div className="text-xs text-gray-500">{student.email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {student.class?.name ?? 'Unassigned'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                                <div className="h-full bg-blue-500" style={{ width: `${progressPercent}%` }} />
                              </div>
                              <span className="text-xs font-bold text-gray-400">{progressPercent.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-white">{avgScore.toFixed(1)}%</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/dashboard/student/${student.id}`}
                              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400 transition-colors hover:text-blue-300"
                            >
                              Details <ChevronRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
