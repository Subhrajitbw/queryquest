import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-for-dev-only'
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                          request.nextUrl.pathname.startsWith('/learning-hub');

  // 1. If no token and trying to access protected route, redirect to login
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If token exists, verify it
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // 3. If teacher trying to access login, redirect to dashboard
      if (request.nextUrl.pathname === '/login') {
        if (payload.role === 'teacher') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
          return NextResponse.redirect(new URL('/learning-hub', request.url));
        }
      }

      // 4. If student trying to access dashboard, redirect to learning hub
      if (payload.role === 'student' && request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/learning-hub', request.url));
      }

    } catch (error) {
      // Invalid token, clear it and redirect to login if accessing protected route
      if (isProtectedRoute) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/learning-hub/:path*', '/login'],
};
