import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { TOTAL_LESSONS } from '@/lib/constants';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

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

    // Class-level aggregates
    const totalStudents = classData.students.length;
    const classAvgProgress = totalStudents > 0
      ? studentsAnalytics.reduce((acc, s) => acc + s.progressPercent, 0) / totalStudents
      : 0;
    const classAvgScore = totalStudents > 0
      ? studentsAnalytics.reduce((acc, s) => acc + s.avgScore, 0) / totalStudents
      : 0;

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error fetching class analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
