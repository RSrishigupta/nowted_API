import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token found' }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);

    if (typeof decoded === 'object' && 'userId' in decoded) {
      const userId = decoded.userId as string;

      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '10', 10);

      const result = await pool.query(
        `SELECT * FROM notes 
         WHERE user_id = $1 AND deleted_at IS NULL
         ORDER BY updated_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return NextResponse.json({ notes: result.rows });
    } else {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (err) {
    console.error('GET /api/notes error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



//////post sahi h 
export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);

    if (typeof decoded !== 'object' || !('userId' in decoded)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId as string;
    const body = await req.json();
    const { folderId, title, content } = body;

    if (!folderId || !title) {
      return NextResponse.json({ error: 'folderId and title are required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO notes (user_id, folder_id, title, content)
       VALUES ($1, $2, $3, $4)
        returning *`,
      [userId, folderId, title, content]
    );

    return NextResponse.json({ note: result.rows[0] }, { status: 201 });

  } catch (err) {
    console.error('POST /api/notes error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
