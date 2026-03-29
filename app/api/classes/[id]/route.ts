import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const classWithStudents = await prisma.class.findUnique({
      where: { id },
      include: {
        students: true,
      },
    });

    if (!classWithStudents) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json(classWithStudents);
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
