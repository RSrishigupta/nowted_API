import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const token = req.headers.get('cookie')?.includes('token=');

  if (!token) {
    console.log(' No token found — user is not logged in');
    return NextResponse.json(
      { message: 'No active session. User already logged out.' },
      { status: 400 }
    );
  }

  console.log('Logging out — clearing token');
  const response = NextResponse.json({ message: 'Logged out successfully' });

  response.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0), // Expire immediately
  });

  return response;
}
