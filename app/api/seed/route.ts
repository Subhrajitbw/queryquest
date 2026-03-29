import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { subDays, startOfDay } from 'date-fns';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // 1. Create a Teacher (Bidipta)
    const hashedPassword = await bcrypt.hash('Teacher@1066', 10);
    const teacher = await prisma.user.upsert({
      where: { email: 'bidipta@example.com' },
      update: {
        password: hashedPassword,
      },
      create: {
        name: 'Bidipta',
        email: 'bidipta@example.com',
        password: hashedPassword,
        role: 'teacher',
      },
    });

    // 2. Create a Class
    const btechClass = await prisma.class.create({
      data: {
        name: 'BTech CS 2026',
        teacherId: teacher.id,
      },
    });

    // 3. Create Students
    const studentNames = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
    const studentPassword = await bcrypt.hash('Student@123', 10);
    const students = await Promise.all(
      studentNames.map((name) =>
        prisma.user.upsert({
          where: { email: `${name.toLowerCase()}@example.com` },
          update: {
            password: studentPassword,
            classId: btechClass.id,
          },
          create: {
            name,
            email: `${name.toLowerCase()}@example.com`,
            password: studentPassword,
            role: 'student',
            classId: btechClass.id,
          },
        })
      )
    );

    // 4. Add Progress and Activity for each student
    const topics = ['SELECT', 'WHERE', 'JOIN', 'GROUP BY', 'HAVING'];
    
    for (const student of students) {
      // Add progress for some topics
      for (const topic of topics) {
        const score = Math.floor(Math.random() * 60) + 40; // 40-100
        await prisma.progress.create({
          data: {
            userId: student.id,
            topic,
            lessonId: `lesson-${topic.toLowerCase()}`,
            score,
            completed: Math.random() > 0.2,
            timeSpent: Math.floor(Math.random() * 600) + 300, // 5-15 mins
            createdAt: subDays(new Date(), Math.floor(Math.random() * 10)),
          },
        });
      }

      // Add activity for the last 30 days
      for (let i = 0; i < 30; i++) {
        if (Math.random() > 0.3) {
          await prisma.activity.create({
            data: {
              userId: student.id,
              date: startOfDay(subDays(new Date(), i)),
              actionsCount: Math.floor(Math.random() * 10) + 1,
            },
          });
        }
      }
    }

    return NextResponse.json({ message: 'Seeding successful' });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
