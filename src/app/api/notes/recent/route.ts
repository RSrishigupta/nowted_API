import { verifyToken } from "@/lib/auth";
import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

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

    const result = await pool.query(`
      SELECT 
        n.id, n.folderId, n.title, n.content, n.isFavourite, n.isArchive,
        n.createdAt, n.updatedAt, n.deletedAt,
        f.id AS folder_id, f.name AS folder_name, f.createdAt AS folder_createdat,
        f.updatedAt AS folder_updatedat, f.deletedAt AS folder_deletedat
      FROM notes n
      LEFT JOIN folders f ON n.folderId = f.id
      WHERE n.userId = $1 AND n.deletedAt IS NULL
      ORDER BY n.updatedAt DESC
      LIMIT 5
    `, [userId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'No notes found' }, { status: 404 });
    }

    const notes = result.rows.map(row => ({
      id: row.id,
      folderId: row.folder_id,
      title: row.title,
      isFavorite: row.isfavourite,
      isArchived: row.isarchive,
      createdAt: row.createdat,
      updatedAt: row.updatedat,
      deletedAt: row.deletedat,
      preview: row.content?.substring(0, 100) || '',
      folder: {
        id: row.folder_id,
        name: row.folder_name,
        createdAt: row.folder_createdat,
        updatedAt: row.folder_updatedat,
        deletedAt: row.folder_deletedat
      }
    }));

    return NextResponse.json({ notes });

  } catch (err) {
    console.error('GET /api/notes error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
