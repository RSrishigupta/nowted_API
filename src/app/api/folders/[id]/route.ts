import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';
// import { JwtPayload } from 'jsonwebtoken';
// delete code
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('token')?.value;
  const folderId = params.id;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Token missing' }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);

    if (typeof decoded === 'object' && 'userId' in decoded) {
      const userId = decoded.userId as string;

      // First check if the folder belongs to the user
      const check = await pool.query(
        'SELECT * FROM folders WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [folderId, userId]
      );

      if (check.rowCount === 0) {
        return NextResponse.json({ error: 'Folder not found OR Unauthorized user' }, { status: 404 });
      }

   
      await pool.query(
        `UPDATE folders
         SET deleted_at = CURRENT_TIMESTAMP
         WHERE id = $1
         `,
         [folderId]
        );
        await pool.query(
          `UPDATE notes 
           set deletedAt = CURRENT_TIMESTAMP
           WHERE folderId = $1 
           `,
           [folderId]
          );

      return NextResponse.json({ message: 'Folder deleted successfuly' });
    } else {
      return NextResponse.json({ error: 'dont have access to delete the folder' }, { status: 401 });
    }
  } catch (err) {
    console.error('DELETE /api/folders/[id] error:',err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



// rename  code 
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const token = req.cookies.get('token')?.value;
    const folderId = params.id;
  
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Token missing' }, { status: 401 });
    }
  
    try {
      const decoded = verifyToken(token);
  
      if (typeof decoded === 'object' && 'userId' in decoded) {
        const userId = decoded.userId as string;
        const body = await req.json();
        const { name } = body;
  
        if (!name || typeof name !== 'string') {
          return NextResponse.json({ error: 'New folder name is required' }, { status: 400 });
        }
  
        // Check if folder belongs to the user
        const check = await pool.query(
          'SELECT * FROM folders WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
          [folderId, userId]
        );
  
        if (check.rowCount === 0) {
          return NextResponse.json({ error: 'Folder not found or access denied' }, { status: 404 });
        }
  
        // Rename the folder
        const result = await pool.query(
          `UPDATE folders
           SET name = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING *`,
          [name, folderId]
        );
  
        return NextResponse.json({ folder: result.rows[0] });
      } else {
        return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
      }
    } catch (err) {
      console.error('PATCH /api/folders/[id] error:', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
  