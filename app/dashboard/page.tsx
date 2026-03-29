'use client';

import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { TeacherSidebar } from '@/components/dashboard/TeacherSidebar';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, GraduationCap, Users, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, classesRes] = await Promise.all([
          fetch('/api/dashboard/overview'),
          fetch('/api/classes') // I need to implement GET /api/classes
        ]);
        
        const overviewData = await overviewRes.json();
        const classesData = await classesRes.json();
        
        setOverview(overviewData);
        setClasses(classesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050505] text-white">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.35em] text-blue-400">
                Admin Workspace
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-tighter text-white uppercase">
                Teacher Dashboard
              </h1>
            </div>
            <form action="/api/seed" method="POST">
              <button
                type="submit"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-gray-300 transition-all hover:bg-white/10"
              >
                Seed Test Data
              </button>
            </form>
          </div>

          <OverviewCards {...overview} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                  <GraduationCap className="h-5 w-5 text-blue-400" /> My Classes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {classes.map((cls) => (
                  <Link
                    key={cls.id}
                    href={`/dashboard/class/${cls.id}`}
                    className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-blue-500/50"
                  >
                    <div>
                      <div className="text-lg font-bold text-white">{cls.name}</div>
                      <div className="text-sm text-gray-400">{cls._count.students} Students</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-600 transition-colors group-hover:text-blue-400" />
                  </Link>
                ))}
                {classes.length === 0 && (
                  <div className="py-8 text-center italic text-gray-500">No classes found.</div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                  <Users className="h-5 w-5 text-green-400" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center italic text-gray-500">
                  Activity feed coming soon.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
