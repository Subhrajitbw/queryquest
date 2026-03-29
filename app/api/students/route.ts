import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, classId, role } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const student = await prisma.user.create({
      data: {
        name,
        email,
        role: role || 'student',
        classId,
      },
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
