// // src/app/api/notes/[id]/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import pool from '@/lib/db';
// import { verifyToken } from '@/lib/auth';

// export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
//   const token = req.cookies.get('token')?.value;

//   if (!token) {
//     return NextResponse.json({ error: 'Unauthorized: No token found' }, { status: 401 });
//   }

//   try {
//     const decoded = verifyToken(token);
//     if (typeof decoded !== 'object' || !('userId' in decoded)) {
//       return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
//     }

//     const userId = decoded.userId as string;
//     const noteId = params.id;

//     const result = await pool.query(
//       `SELECT * FROM notes
//        WHERE id = $1 AND userId = $2 AND deletedAt IS NULL AND isArchive =false`,
//       [noteId, userId]
//     );

//     if (result.rowCount === 0) {
//       return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
//     }

//     return NextResponse.json({ note: result.rows[0] });

//   } catch (err) {
//     console.error('GET /api/notes/[id] error:', err);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    const result = await pool.query(
      `
      SELECT 
        n.id, n.folderId, n.title, n.content, n.isFavourite, n.isArchive,
        n.createdAt, n.updatedAt, n.deletedAt,
        f.id AS folder_id, f.name AS folder_name, f.createdAt AS folder_createdat,
        f.updatedAt AS folder_updatedat, f.deletedAt AS folder_deletedat
      FROM notes n
      LEFT JOIN folders f ON n.folderId = f.id
      WHERE n.id = $1 AND n.userId = $2 AND n.deletedAt IS NULL AND n.isArchive = false
      `,
      [noteId, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    const row = result.rows[0];

    const note = {
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
        deletedAt: row.folder_deletedat,
      }
    };

    return NextResponse.json({ note });

  } catch (err) {
    console.error('GET /api/notes/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Ensure the note belongs to the user before soft-deleting
    const result = await pool.query(
      `UPDATE notes
       SET deletedat = CURRENT_TIMESTAMP
       WHERE id = $1 AND userId = $2
       RETURNING *`,
      [noteId, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Note deleted successfully' });

  } catch (err) {
    console.error('DELETE /api/notes/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const body = await req.json();
    const { title, content, isFavourite, isArchive, folderId } = body;

    if (
      title === undefined &&
      content === undefined &&
      isFavourite === undefined &&
      isArchive === undefined &&
      folderId === undefined
    ) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const fields: string[] = [];
    const values: (string|number|boolean)[] = [];
    let index = 1;

    if (title !== undefined) {
      fields.push(`title = $${index++}`);
      values.push(title);
    }

    if (content !== undefined) {
      fields.push(`content = $${index++}`);
      values.push(content);
    }

    if (isFavourite !== undefined) {
      fields.push(`isFavourite = $${index++}`);
      values.push(isFavourite);
    }

    if (isArchive !== undefined) {
      fields.push(`isArchive = $${index++}`);
      values.push(isArchive);
    }

    if (folderId !== undefined) {
      fields.push(`folderId = $${index++}`);
      values.push(folderId);
    }

    // Always update timestamp
    fields.push(`updatedAt = CURRENT_TIMESTAMP`);

    // Add WHERE clause values
    values.push(noteId, userId);

    const query = `
      UPDATE notes
      SET ${fields.join(', ')}
      WHERE id = $${index++} AND userId = $${index}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Note updated', note: result.rows[0] });

  } catch (err) {
    console.error('PATCH /api/notes/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}