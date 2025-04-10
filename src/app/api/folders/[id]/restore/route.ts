
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
    const folderId = params.id;

    const result = await pool.query(
      `
      UPDATE folders
      SET deleted_at = NULL
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [folderId, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Folder not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Folder restored successfully', folder: result.rows[0] });

  } catch (err) {
    console.error('PATCH /api/folders/[id]/restore error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
