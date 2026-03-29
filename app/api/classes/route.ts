import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, teacherId } = body;

    if (!name || !teacherId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        teacherId,
      },
    });

    return NextResponse.json(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
    });
    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
