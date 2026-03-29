import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { differenceInDays, startOfDay } from 'date-fns';
import { TOTAL_LESSONS } from '@/lib/constants';
import { calculateStreak } from '@/lib/analytics';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        progress: true,
        activity: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 1. Progress %
    const completedLessons = user.progress.filter(p => p.completed).length;
    const progressPercent = (completedLessons / TOTAL_LESSONS) * 100;

    // 2. Average Score
    const avgScore = user.progress.length > 0
      ? user.progress.reduce((acc, p) => acc + p.score, 0) / user.progress.length
      : 0;

    // 3. Consistency
    const activeDays = user.activity.length;
    const firstActivity = user.activity.sort((a, b) => a.date.getTime() - b.date.getTime())[0];
    const totalDays = firstActivity 
      ? Math.max(1, differenceInDays(new Date(), firstActivity.date) + 1)
      : 1;
    const consistency = (activeDays / totalDays) * 100;

    // 4. Streak
    const streak = calculateStreak(user.activity);

    // 5. Daily Activity
    const dailyActivity = user.activity.map(a => ({
      date: a.date.toISOString().split('T')[0],
      count: a.actionsCount,
    }));

    // 6. Topic Mastery
    const topics = Array.from(new Set(user.progress.map(p => p.topic)));
    const topicMastery = topics.map(topic => {
      const topicProgress = user.progress.filter(p => p.topic === topic);
      const avg = topicProgress.reduce((acc, p) => acc + p.score, 0) / topicProgress.length;
      return { topic, score: avg };
    });

    // 7. Time Spent
    const totalTimeSpent = user.progress.reduce((acc, p) => acc + p.timeSpent, 0);

    // 8. Weak Topics
    const weakTopics = topicMastery.filter(t => t.score < 50).map(t => t.topic);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      analytics: {
        progressPercent,
        avgScore,
        consistency,
        streak,
        dailyActivity,
        topicMastery,
        totalTimeSpent,
        weakTopics,
      },
    });
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
