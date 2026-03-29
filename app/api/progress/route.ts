import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { startOfDay } from 'date-fns';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, topic, lessonId, score, completed, timeSpent } = body;

    if (!userId || !topic || !lessonId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const today = startOfDay(new Date());

    const result = await prisma.$transaction(async (tx) => {
      // 1. Log progress
      const progress = await tx.progress.create({
        data: {
          userId,
          topic,
          lessonId,
          score,
          completed,
          timeSpent,
        },
      });

      // 2. Update activity for today
      const activity = await tx.activity.findFirst({
        where: {
          userId,
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (activity) {
        await tx.activity.update({
          where: { id: activity.id },
          data: { actionsCount: { increment: 1 } },
        });
      } else {
        await tx.activity.create({
          data: {
            userId,
            date: today,
            actionsCount: 1,
          },
        });
      }

      return progress;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error logging progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
