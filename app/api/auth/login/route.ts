import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-for-dev-only'
);
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const demoUser = {
  id: 'demo-student',
  name: 'Demo Student',
  email: 'alice@example.com',
  password: 'Student@123',
  role: 'student' as const,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const user = hasDatabaseUrl
      ? await prisma.user.findUnique({
          where: { email },
        })
      : email === demoUser.email
        ? demoUser
        : null;

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = hasDatabaseUrl
      ? await bcrypt.compare(password, user.password)
      : password === demoUser.password;

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT
    const token = await new SignJWT({ 
      userId: user.id, 
      role: user.role,
      email: user.email,
      name: user.name 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, name: user.name, role: user.role } 
    });

    // Set cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
