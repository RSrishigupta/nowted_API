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
        SELECT * FROM notes 
        WHERE userId = $1 AND deletedAt IS NULL 
        ORDER BY updatedAt DESC 
        LIMIT 5`, [userId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }
    return NextResponse.json({ note: result.rows });
  } catch (err) {
    console.error('GET /api/notes/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

