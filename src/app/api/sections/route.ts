import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/sections - Get sections for a workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const sectionId = searchParams.get('id');
    const db = await getConnection();

    if (sectionId) {
      // Get specific section with subsections and pages
      const [sectionRows] = await db.execute(
        'SELECT * FROM sections WHERE id = ?',
        [sectionId]
      ) as [RowDataPacket[], any];

      if (sectionRows.length === 0) {
        return NextResponse.json(
          { error: 'Section not found' },
          { status: 404 }
        );
      }

      const section = sectionRows[0];

      // Get subsections for this section
      const [subsectionRows] = await db.execute(
        'SELECT * FROM subsections WHERE section_id = ? ORDER BY subsection_order',
        [sectionId]
      ) as [RowDataPacket[], any];

      const subsections = [];
      for (const subsection of subsectionRows) {
        // Get pages for this subsection
        const [pageRows] = await db.execute(
          'SELECT * FROM pages WHERE subsection_id = ? ORDER BY created_at',
          [subsection.id]
        ) as [RowDataPacket[], any];

        const pages = [];
        for (const page of pageRows) {
          // Get content blocks for this page
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

        subsections.push({
          ...subsection,
          order: subsection.subsection_order,
          pages
        });
      }

      // Get direct pages for this section (not in subsections)
      const [directPageRows] = await db.execute(
        'SELECT * FROM pages WHERE section_id = ? AND subsection_id IS NULL ORDER BY created_at',
        [sectionId]
      ) as [RowDataPacket[], any];

      const directPages = [];
      for (const page of directPageRows) {
        const [blockRows] = await db.execute(
          'SELECT * FROM content_blocks WHERE page_id = ? ORDER BY block_order',
          [page.id]
        ) as [RowDataPacket[], any];

        directPages.push({
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

      const result = {
        ...section,
        order: section.section_order,
        subsections,
        pages: directPages
      };

      return NextResponse.json(result);
    } else if (workspaceId) {
      // Get all sections for workspace with their subsections and pages
      const [sectionRows] = await db.execute(
        'SELECT * FROM sections WHERE workspace_id = ? ORDER BY section_order',
        [workspaceId]
      ) as [RowDataPacket[], any];

      const sections = [];
      for (const section of sectionRows) {
        // Get subsections for this section
        const [subsectionRows] = await db.execute(
          'SELECT * FROM subsections WHERE section_id = ? ORDER BY subsection_order',
          [section.id]
        ) as [RowDataPacket[], any];

        const subsections = [];
        for (const subsection of subsectionRows) {
          // Get pages for this subsection
          const [pageRows] = await db.execute(
            'SELECT * FROM pages WHERE subsection_id = ? ORDER BY created_at',
            [subsection.id]
          ) as [RowDataPacket[], any];

          const pages = pageRows.map(page => ({
            ...page,
            assignees: page.assignees ? JSON.parse(page.assignees) : [],
            properties: page.properties ? JSON.parse(page.properties) : {},
            content: [] // Don't load blocks for list view for performance
          }));

          subsections.push({
            ...subsection,
            order: subsection.subsection_order,
            pages
          });
        }

        // Get direct pages for this section
        const [directPageRows] = await db.execute(
          'SELECT * FROM pages WHERE section_id = ? AND subsection_id IS NULL ORDER BY created_at',
          [section.id]
        ) as [RowDataPacket[], any];

        const directPages = directPageRows.map(page => ({
          ...page,
          assignees: page.assignees ? JSON.parse(page.assignees) : [],
          properties: page.properties ? JSON.parse(page.properties) : {},
          content: [] // Don't load blocks for list view for performance
        }));

        sections.push({
          ...section,
          order: section.section_order,
          subsections,
          pages: directPages
        });
      }

      return NextResponse.json(sections);
    } else {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sections - Create new section
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, title, icon, order } = body;

    if (!workspaceId || !title) {
      return NextResponse.json(
        { error: 'Workspace ID and title are required' },
        { status: 400 }
      );
    }

    const db = await getConnection();
    let sectionOrder = order;
    
    if (order === undefined) {
      // If no order specified, add at the end
      const [maxOrderRows] = await db.execute(
        'SELECT MAX(section_order) as maxOrder FROM sections WHERE workspace_id = ?',
        [workspaceId]
      ) as [RowDataPacket[], any];
      
      sectionOrder = maxOrderRows[0].maxOrder !== null ? maxOrderRows[0].maxOrder + 1 : 1;
    }

    const sectionId = generateUUID();

    // Create the section
    await db.execute(
      'INSERT INTO sections (id, workspace_id, title, icon, section_order) VALUES (?, ?, ?, ?, ?)',
      [sectionId, workspaceId, title, icon || '📁', sectionOrder]
    );

    // Create default subsections (Management, Execution, Inbox)
    const subsections = [
      { id: generateUUID(), title: 'Management', order: 1 },
      { id: generateUUID(), title: 'Execution', order: 2 },
      { id: generateUUID(), title: 'Inbox', order: 3 }
    ];

    for (const subsection of subsections) {
      await db.execute(
        'INSERT INTO subsections (id, section_id, title, subsection_order) VALUES (?, ?, ?, ?)',
        [subsection.id, sectionId, subsection.title, subsection.order]
      );
    }

    // Get the created section with its subsections
    const [sectionRows] = await db.execute(
      'SELECT * FROM sections WHERE id = ?',
      [sectionId]
    ) as [RowDataPacket[], any];

    const [subsectionRows] = await db.execute(
      'SELECT * FROM subsections WHERE section_id = ? ORDER BY subsection_order',
      [sectionId]
    ) as [RowDataPacket[], any];

    const result = {
      ...sectionRows[0],
      order: sectionRows[0].section_order,
      subsections: subsectionRows.map(sub => ({
        ...sub,
        order: sub.subsection_order,
        pages: []
      })),
      pages: []
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/sections - Update section
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, icon, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Section ID is required' },
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
    if (order !== undefined) {
      updates.push('section_order = ?');
      params.push(order);
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
      `UPDATE sections SET ${updates.join(', ')} WHERE id = ?`,
      params
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Get the updated section
    const [rows] = await db.execute(
      'SELECT * FROM sections WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];

    const updatedSection = {
      ...rows[0],
      order: rows[0].section_order
    };

    return NextResponse.json(updatedSection);
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/sections - Delete section
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('id');

    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      );
    }

    const db = await getConnection();

    const [result] = await db.execute(
      'DELETE FROM sections WHERE id = ?',
      [sectionId]
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting section:', error);
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