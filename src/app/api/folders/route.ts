import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Token missing' }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);

    if (typeof decoded === 'object' && 'userId' in decoded) {
      const userId = decoded.userId as string;

      const result = await pool.query(
        'SELECT * FROM folders WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
        [userId]
      );

      return NextResponse.json({ folders: result.rows });
    } else {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }
  } catch (err) {
    console.error('GET /api/folders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ User_Not_Available: 'Please Login first to continue ... . ...' }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);

    if (typeof decoded === 'object' && 'userId' in decoded) {
      const userId = decoded.userId as string;
      const body = await req.json();
      const { name } = body;

      if (!name || typeof name !== 'string') {
        return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
      }
      const result = await pool.query(
        `INSERT INTO folders (user_id, name)
         VALUES ($1, $2)
         RETURNING *`,
        [userId, name]
      );

      return NextResponse.json({ folder: result.rows[0] }, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }
  } catch (err) {
    console.error('POST /api/folders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
