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

    if (typeof decoded !== 'object' || !('userId' in decoded)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId as string;
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const folderId = searchParams.get('folderId');
    const isFavourite = searchParams.get('isFavourite');
    const isArchive = searchParams.get('isArchive');

    let query = `
      SELECT * FROM notes
      WHERE userId = $1 AND deletedAt IS NULL
    `;
    const values: (string|number)[] = [userId];
    let paramIndex = 2;

    if (folderId) {
      query += ` AND folderId = $${paramIndex}`;
      values.push(folderId);
      paramIndex++;
    }

    if (isFavourite === 'true') {
      query += ` AND isFavourite = true`;
    }

    if (isArchive === 'true') {
      query += ` AND isArchive = true`;
    }

    query += ` ORDER BY updatedAt DESC LIMIT $${paramIndex}`;
    values.push(limit);

    const result = await pool.query(query, values);
    return NextResponse.json({ notes: result.rows });
  } catch (err) {
    console.error('GET /api/notes error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      `INSERT INTO notes (userId, folderId, title, content)
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
