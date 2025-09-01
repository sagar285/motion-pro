import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/pages - Get pages or specific page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('id');
    const sectionId = searchParams.get('sectionId');
    const subsectionId = searchParams.get('subsectionId');
    const db = await getConnection();

    if (pageId) {
      // Get specific page with content blocks
      const [pageRows] = await db.execute(
        'SELECT * FROM pages WHERE id = ?',
        [pageId]
      ) as [RowDataPacket[], any];

      if (pageRows.length === 0) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        );
      }

      const page = pageRows[0];

      // Get content blocks for this page
      const [blockRows] = await db.execute(
        'SELECT * FROM content_blocks WHERE page_id = ? ORDER BY block_order',
        [pageId]
      ) as [RowDataPacket[], any];

      const result = {
        ...page,
        assignees: page.assignees ? JSON.parse(page.assignees) : [],
        properties: page.properties ? JSON.parse(page.properties) : {},
        content: blockRows.map(block => ({
          ...block,
          metadata: block.metadata ? JSON.parse(block.metadata) : {},
          order: block.block_order
        }))
      };

      return NextResponse.json(result);
    } else {
      // Get pages by section/subsection
      let query = 'SELECT * FROM pages';
      let params: any[] = [];

      if (subsectionId) {
        query += ' WHERE subsection_id = ?';
        params = [subsectionId];
      } else if (sectionId) {
        query += ' WHERE section_id = ? AND subsection_id IS NULL';
        params = [sectionId];
      }

      query += ' ORDER BY created_at DESC';

      const [pageRows] = await db.execute(query, params) as [RowDataPacket[], any];

      const pages = [];
      for (const page of pageRows) {
        // Get content blocks for each page
        const [blockRows] = await db.execute(
          'SELECT * FROM content_blocks WHERE page_id = ? ORDER BY block_order',
          [page.id]
        ) as [RowDataPacket[], any];

        pages.push({
          ...page,
          assignees: page.assignees ? JSON.parse(page.assignees) : [],
          properties: page.properties ? JSON.parse(page.properties) : {},
          content: blockRows.map(block => ({
            ...block,
            metadata: block.metadata ? JSON.parse(block.metadata) : {},
            order: block.block_order
          }))
        });
      }

      return NextResponse.json(pages);
    }
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/pages - Create new page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      workspaceId, 
      sectionId, 
      subsectionId, 
      title, 
      icon, 
      type = 'page',
      status,
      assignees = [],
      deadline,
      properties = {}
    } = body;

    if (!workspaceId || !title) {
      return NextResponse.json(
        { error: 'Workspace ID and title are required' },
        { status: 400 }
      );
    }

    const db = await getConnection();
    const pageId = generateUUID();

    const [result] = await db.execute(`
      INSERT INTO pages (id, workspace_id, section_id, subsection_id, title, icon, type, status, assignees, deadline, properties) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      pageId,
      workspaceId,
      sectionId || null,
      subsectionId || null,
      title,
      icon || '📄',
      type,
      status || null,
      JSON.stringify(assignees),
      deadline || null,
      JSON.stringify(properties)
    ]) as [ResultSetHeader, any];

    // Get the created page
    const [rows] = await db.execute(
      'SELECT * FROM pages WHERE id = ?',
      [pageId]
    ) as [RowDataPacket[], any];

    const newPage = {
      ...rows[0],
      assignees: rows[0].assignees ? JSON.parse(rows[0].assignees) : [],
      properties: rows[0].properties ? JSON.parse(rows[0].properties) : {},
      content: []
    };

    return NextResponse.json(newPage, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/pages - Update page
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      title, 
      icon, 
      type, 
      status, 
      assignees, 
      deadline, 
      properties 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    const db = await getConnection();
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (assignees !== undefined) {
      updates.push('assignees = ?');
      params.push(JSON.stringify(assignees));
    }
    if (deadline !== undefined) {
      updates.push('deadline = ?');
      params.push(deadline);
    }
    if (properties !== undefined) {
      updates.push('properties = ?');
      params.push(JSON.stringify(properties));
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const [result] = await db.execute(
      `UPDATE pages SET ${updates.join(', ')} WHERE id = ?`,
      params
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Get the updated page with content blocks
    const [pageRows] = await db.execute(
      'SELECT * FROM pages WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];

    const [blockRows] = await db.execute(
      'SELECT * FROM content_blocks WHERE page_id = ? ORDER BY block_order',
      [id]
    ) as [RowDataPacket[], any];

    const updatedPage = {
      ...pageRows[0],
      assignees: pageRows[0].assignees ? JSON.parse(pageRows[0].assignees) : [],
      properties: pageRows[0].properties ? JSON.parse(pageRows[0].properties) : {},
      content: blockRows.map(block => ({
        ...block,
        metadata: block.metadata ? JSON.parse(block.metadata) : {},
        order: block.block_order
      }))
    };

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/pages - Delete page
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('id');

    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    const db = await getConnection();

    const [result] = await db.execute(
      'DELETE FROM pages WHERE id = ?',
      [pageId]
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
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

