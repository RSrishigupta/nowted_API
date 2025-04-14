import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth'
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
      SELECT 
        n.id, n.folderId, n.title, n.content, n.isfavourite, n.isarchive,
        n.createdat, n.updatedat, n.deletedat,
        f.id AS folder_id, f.name AS folder_name, f.createdat AS folder_createdat,
        f.updatedat AS folder_updatedat, f.deletedat AS folder_deletedat
      FROM notes n
      LEFT JOIN folders f ON n.folderId = f.id
      WHERE n.userId = $1 AND n.deletedAt IS NULL
    `;
    const values: (string | number)[] = [userId];
    let paramIndex = 2;

    if (folderId) {
      query += ` AND n.folderId = $${paramIndex}`;
      values.push(folderId);
      paramIndex++;
    }

    if (isFavourite === 'true') {
      query += ` AND n.isFavourite = true`;
    }

    if (isArchive === 'true') {
      query += ` AND n.isArchive = true`;
    }

    query += ` ORDER BY n.updatedAt DESC LIMIT $${paramIndex}`;
    values.push(limit);

    const result = await pool.query(query, values);

    const formattedNotes = result.rows.map((row) => ({
      id: row.id,
      folderId: row.folder_id,
      title: row.title,
      isFavorite: row.isfavourite,
      isArchived: row.isarchive,
      createdAt: row.createdat,
      updatedAt: row.updatedat,
      deletedAt: row.deletedat,
      preview: row.content?.substring(0, 100) || '', // Optional preview snippet
      folder: {
        id: row.folder_id,
        name: row.folder_name,
        createdAt: row.folder_createdat,
        updatedAt: row.folder_updatedat,
        deletedAt: row.folder_deletedat,
      }
    }));

    return NextResponse.json({ notes: formattedNotes });

  } catch (err) {
    console.error('GET /api/notes error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
