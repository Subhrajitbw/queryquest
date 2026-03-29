import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { startOfDay } from 'date-fns';
import { TOTAL_LESSONS } from '@/lib/constants';

export async function GET() {
  try {
    const today = startOfDay(new Date());

    // 1. Total students
    const totalStudents = await prisma.user.count({
      where: { role: 'student' },
    });

    // 2. Active today
    const activeToday = await prisma.activity.count({
      where: {
        date: {
          gte: today,
        },
      },
    });

    // 3. Average score and completion
    const stats = await prisma.progress.aggregate({
      _avg: {
        score: true,
      },
      _count: {
        completed: true,
      },
      where: {
        completed: true,
      },
    });

    // 4. Average completion rate
    // We need to calculate this per student and then average it.
    // Or we can just get total completed lessons / (total students * total lessons)
    const totalCompleted = stats._count.completed || 0;
    const avgCompletion = totalStudents > 0 
      ? (totalCompleted / (totalStudents * TOTAL_LESSONS)) * 100 
      : 0;

    return NextResponse.json({
      totalStudents,
      activeToday,
      avgScore: stats._avg.score || 0,
      avgCompletion,
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
