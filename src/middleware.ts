import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const protectedRoutes = ['/dashboard', '/api/dashboard'];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  const isProtected = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const decoded = verifyToken(token);
    if (typeof decoded !== 'object' || !('userId' in decoded)) {
      throw new Error('Invalid token');
    }
    return NextResponse.next();
  } catch (err) {
    console.error('Middleware JWT error:', err);
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/dashboard'],
};
