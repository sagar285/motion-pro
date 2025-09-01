import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/comments - Get comments for a page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const commentId = searchParams.get('id');
    const db = await getConnection();

    if (commentId) {
      // Get specific comment with user data
      const [rows] = await db.execute(`
        SELECT c.*, wm.name as userName, wm.email, wm.avatar 
        FROM comments c
        JOIN workspace_members wm ON c.user_id = wm.id
        WHERE c.id = ?
      `, [commentId]) as [RowDataPacket[], any];

      if (rows.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      const comment = {
        id: rows[0].id,
        pageId: rows[0].page_id,
        userId: rows[0].user_id,
        userName: rows[0].userName,
        content: rows[0].content,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at,
        user: {
          id: rows[0].user_id,
          name: rows[0].userName,
          email: rows[0].email,
          avatar: rows[0].avatar
        }
      };

      return NextResponse.json(comment);
    } else if (pageId) {
      // Get all comments for a page with user data
      const [rows] = await db.execute(`
        SELECT c.*, wm.name as userName, wm.email, wm.avatar 
        FROM comments c
        JOIN workspace_members wm ON c.user_id = wm.id
        WHERE c.page_id = ?
        ORDER BY c.created_at DESC
      `, [pageId]) as [RowDataPacket[], any];

      const comments = rows.map(row => ({
        id: row.id,
        pageId: row.page_id,
        userId: row.user_id,
        userName: row.userName,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user: {
          id: row.user_id,
          name: row.userName,
          email: row.email,
          avatar: row.avatar
        }
      }));

      return NextResponse.json(comments);
    } else {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/comments - Create new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, userId, content } = body;

    if (!pageId || !userId || !content) {
      return NextResponse.json(
        { error: 'Page ID, user ID, and content are required' },
        { status: 400 }
      );
    }

    const db = await getConnection();
    const commentId = generateUUID();

    // Verify that the user exists in workspace_members
    const [userRows] = await db.execute(
      'SELECT id FROM workspace_members WHERE id = ?',
      [userId]
    ) as [RowDataPacket[], any];

    if (userRows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create the comment
    await db.execute(
      'INSERT INTO comments (id, page_id, user_id, content) VALUES (?, ?, ?, ?)',
      [commentId, pageId, userId, content.trim()]
    );

    // Get the created comment with user data
    const [commentRows] = await db.execute(`
      SELECT c.*, wm.name as userName, wm.email, wm.avatar 
      FROM comments c
      JOIN workspace_members wm ON c.user_id = wm.id
      WHERE c.id = ?
    `, [commentId]) as [RowDataPacket[], any];

    const newComment = {
      id: commentRows[0].id,
      pageId: commentRows[0].page_id,
      userId: commentRows[0].user_id,
      userName: commentRows[0].userName,
      content: commentRows[0].content,
      createdAt: commentRows[0].created_at,
      updatedAt: commentRows[0].updated_at,
      user: {
        id: commentRows[0].user_id,
        name: commentRows[0].userName,
        email: commentRows[0].email,
        avatar: commentRows[0].avatar
      }
    };

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/comments - Update comment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content } = body;

    if (!id || !content) {
      return NextResponse.json(
        { error: 'Comment ID and content are required' },
        { status: 400 }
      );
    }

    const db = await getConnection();

    const [result] = await db.execute(
      'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content.trim(), id]
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Get the updated comment with user data
    const [commentRows] = await db.execute(`
      SELECT c.*, wm.name as userName, wm.email, wm.avatar 
      FROM comments c
      JOIN workspace_members wm ON c.user_id = wm.id
      WHERE c.id = ?
    `, [id]) as [RowDataPacket[], any];

    const updatedComment = {
      id: commentRows[0].id,
      pageId: commentRows[0].page_id,
      userId: commentRows[0].user_id,
      userName: commentRows[0].userName,
      content: commentRows[0].content,
      createdAt: commentRows[0].created_at,
      updatedAt: commentRows[0].updated_at,
      user: {
        id: commentRows[0].user_id,
        name: commentRows[0].userName,
        email: commentRows[0].email,
        avatar: commentRows[0].avatar
      }
    };

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments - Delete comment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    const db = await getConnection();

    const [result] = await db.execute(
      'DELETE FROM comments WHERE id = ?',
      [commentId]
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Utility function to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}