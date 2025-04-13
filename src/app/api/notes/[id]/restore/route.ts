import { verifyToken } from "@/lib/auth";
import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";


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
    const noteId = params.id;
    const result = await pool.query(`
      UPDATE notes
      SET deletedAt = NULL
      WHERE id = $1 AND userId = $2 AND deletedAt IS NOT NULL
      RETURNING *
    `, [noteId, userId]);
    await pool.query(
      `UPDATE folders
       SET deletedAt = NULL
       WHERE id=(select folderId from notes where id=$1)
       `,[noteId]
      );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Note restore succeful', note: result.rows[0] });

  } catch (err) {
    console.error('PATCH /api/notes/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}