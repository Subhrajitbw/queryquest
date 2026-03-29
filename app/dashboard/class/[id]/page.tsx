import { prisma } from '@/lib/prisma';
import { TOTAL_LESSONS } from '@/lib/constants';
import { TeacherSidebar } from '@/components/dashboard/TeacherSidebar';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Users, Target, CheckCircle, ArrowLeft } from 'lucide-react';

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
    <div className="flex h-screen bg-[#050505] text-white">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-all hover:border-blue-500/50 hover:text-blue-400">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase">{data.class.name} Analytics</h1>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Students</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.analytics.totalStudents}</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Avg. Progress</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.analytics.avgProgress.toFixed(1)}%</div>
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
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Student Roster</CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Student</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Progress</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Avg. Score</th>
                      <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.students.map((student) => (
                      <tr key={student.id} className="group transition-colors hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">{student.name}</div>
                          <div className="text-xs text-gray-500">{student.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                              <div className="h-full bg-blue-500" style={{ width: `${student.progressPercent}%` }} />
                            </div>
                            <span className="text-xs font-bold text-gray-400">{student.progressPercent.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold ${student.avgScore >= 80 ? 'text-green-400' : student.avgScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {student.avgScore.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/dashboard/student/${student.id}`} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400 transition-colors hover:text-blue-300">
                            Details <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
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
