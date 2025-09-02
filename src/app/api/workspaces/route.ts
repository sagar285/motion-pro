import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Utility function to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to build complete workspace data structure
async function buildWorkspaceData(db: any, workspaceId: string) {
  // Get workspace basic info
  const [workspaceRows] = await db.execute(
    'SELECT * FROM workspaces WHERE id = ?',
    [workspaceId]
  ) as [RowDataPacket[], any];

  if (workspaceRows.length === 0) {
    return null;
  }

  const workspace = workspaceRows[0];

  // Get workspace members
  const [memberRows] = await db.execute(
    'SELECT id, name, email, avatar, role, created_at, updated_at FROM workspace_members WHERE workspace_id = ? ORDER BY created_at',
    [workspaceId]
  ) as [RowDataPacket[], any];

  // Get all sections for this workspace
  const [sectionRows] = await db.execute(
    'SELECT * FROM sections WHERE workspace_id = ? ORDER BY section_order ASC',
    [workspaceId]
  ) as [RowDataPacket[], any];

  const sections = [];

  for (const section of sectionRows) {
    // Get subsections for this section
    const [subsectionRows] = await db.execute(
      'SELECT * FROM subsections WHERE section_id = ? ORDER BY subsection_order ASC',
      [section.id]
    ) as [RowDataPacket[], any];

    const subsections = [];

    // Process each subsection
    for (const subsection of subsectionRows) {
      // Get pages for this subsection
      const [subsectionPageRows] = await db.execute(
        'SELECT * FROM pages WHERE subsection_id = ? ORDER BY created_at ASC',
        [subsection.id]
      ) as [RowDataPacket[], any];

      const subsectionPages = [];

      for (const page of subsectionPageRows) {
        // Get content blocks for this page
        const [blockRows] = await db.execute(
          'SELECT * FROM content_blocks WHERE page_id = ? ORDER BY block_order ASC',
          [page.id]
        ) as [RowDataPacket[], any];

        const processedPage = {
          id: page.id,
          title: page.title,
          icon: page.icon,
          type: page.type,
          status: page.status,
          assignees: page.assignees ? JSON.parse(page.assignees) : [],
          deadline: page.deadline,
          properties: page.properties ? JSON.parse(page.properties) : {},
          createdAt: page.created_at,
          updatedAt: page.updated_at,
          content: blockRows.map(block => ({
            id: block.id,
            type: block.type,
            content: block.content,
            metadata: block.metadata ? JSON.parse(block.metadata) : {},
            createdAt: block.created_at,
            updatedAt: block.updated_at
          }))
        };

        subsectionPages.push(processedPage);
      }

      subsections.push({
        id: subsection.id,
        title: subsection.title,
        order: subsection.subsection_order,
        pages: subsectionPages
      });
    }

    // Get direct pages for this section (not in any subsection)
    const [directPageRows] = await db.execute(
      'SELECT * FROM pages WHERE section_id = ? AND subsection_id IS NULL ORDER BY created_at ASC',
      [section.id]
    ) as [RowDataPacket[], any];

    const directPages = [];

    for (const page of directPageRows) {
      // Get content blocks for this page
      const [blockRows] = await db.execute(
        'SELECT * FROM content_blocks WHERE page_id = ? ORDER BY block_order ASC',
        [page.id]
      ) as [RowDataPacket[], any];

      const processedPage = {
        id: page.id,
        title: page.title,
        icon: page.icon,
        type: page.type,
        status: page.status,
        assignees: page.assignees ? JSON.parse(page.assignees) : [],
        deadline: page.deadline,
        properties: page.properties ? JSON.parse(page.properties) : {},
        createdAt: page.created_at,
        updatedAt: page.updated_at,
        content: blockRows.map(block => ({
          id: block.id,
          type: block.type,
          content: block.content,
          metadata: block.metadata ? JSON.parse(block.metadata) : {},
          createdAt: block.created_at,
          updatedAt: block.updated_at
        }))
      };

      directPages.push(processedPage);
    }

    sections.push({
      id: section.id,
      title: section.title,
      icon: section.icon,
      order: section.section_order,
      pages: directPages,
      subsections: subsections
    });
  }

  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    createdAt: workspace.created_at,
    updatedAt: workspace.updated_at,
    members: memberRows.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      avatar: member.avatar,
      role: member.role,
      createdAt: member.created_at,
      updatedAt: member.updated_at
    })),
    sections: sections
  };
}

// GET /api/workspaces - Get all workspaces or specific workspace
export async function GET(request: NextRequest) {
  let db;
  
  try {
    db = await getConnection();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('id');

    if (workspaceId) {
      console.log(`🔍 Fetching workspace: ${workspaceId}`);
      
      const workspaceData = await buildWorkspaceData(db, workspaceId);
      
      if (!workspaceData) {
        return NextResponse.json(
          { error: 'Workspace not found' },
          { status: 404 }
        );
      }

      console.log(`✅ Workspace fetched successfully with ${workspaceData.sections.length} sections`);
      return NextResponse.json(workspaceData);
      
    } else {
      console.log('📋 Fetching all workspaces');
      
      // Get all workspaces (basic info only for listing)
      const [workspaceRows] = await db.execute(
        'SELECT id, name, description, created_at, updated_at FROM workspaces ORDER BY created_at DESC'
      ) as [RowDataPacket[], any];

      const workspaces = workspaceRows.map(workspace => ({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at
      }));

      console.log(`✅ Found ${workspaces.length} workspaces`);
      return NextResponse.json(workspaces);
    }
    
  } catch (error) {
  console.error('❌ Error fetching workspaces:', error);

  let message = 'Unexpected error';
  if (error instanceof Error) {
    message = error.message;
  }

  return NextResponse.json(
    { 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? message : undefined
    },
    { status: 500 }
  );
}

}

// POST /api/workspaces - Create new workspace
export async function POST(request: NextRequest) {
  let db;
  
  try {
    db = await getConnection();
    const body = await request.json();
    const { name, description, ownerName, ownerEmail } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      );
    }

    console.log(`📝 Creating workspace: ${name}`);

    // Start transaction for workspace creation
    await db.execute('START TRANSACTION');

    try {
      const workspaceId = generateUUID();

      // Create the workspace
      await db.execute(
        'INSERT INTO workspaces (id, name, description) VALUES (?, ?, ?)',
        [workspaceId, name.trim(), description || null]
      );

      console.log(`✅ Workspace created with ID: ${workspaceId}`);

      // Create default owner if provided
      if (ownerName && ownerEmail) {
        const ownerId = generateUUID();
        await db.execute(
          'INSERT INTO workspace_members (id, workspace_id, name, email, role) VALUES (?, ?, ?, ?, ?)',
          [ownerId, workspaceId, ownerName.trim(), ownerEmail.trim(), 'owner']
        );
        console.log(`✅ Default owner created: ${ownerName}`);
      }

      // Create default sections with subsections
      const defaultSections = [
        { title: 'Company Overview', icon: '🏢', order: 1 },
        { title: 'Marketing', icon: '📈', order: 2 },
        { title: 'BD & Sales', icon: '💼', order: 3 },
        { title: 'HR & Operation', icon: '👥', order: 4 }
      ];

      for (const sectionData of defaultSections) {
        const sectionId = generateUUID();
        
        // Create section
        await db.execute(
          'INSERT INTO sections (id, workspace_id, title, icon, section_order) VALUES (?, ?, ?, ?, ?)',
          [sectionId, workspaceId, sectionData.title, sectionData.icon, sectionData.order]
        );

        // Create default subsections for each section
        const defaultSubsections = [
          { title: 'Management', order: 1 },
          { title: 'Execution', order: 2 },
          { title: 'Inbox', order: 3 }
        ];

        for (const subsectionData of defaultSubsections) {
          const subsectionId = generateUUID();
          await db.execute(
            'INSERT INTO subsections (id, section_id, title, subsection_order) VALUES (?, ?, ?, ?)',
            [subsectionId, sectionId, subsectionData.title, subsectionData.order]
          );
        }
      }

      console.log('✅ Default sections and subsections created');

      // Commit transaction
      await db.execute('COMMIT');

      // Fetch and return the complete workspace data
      const newWorkspaceData = await buildWorkspaceData(db, workspaceId);
      
      console.log(`🎉 Workspace "${name}" created successfully`);
      return NextResponse.json(newWorkspaceData, { status: 201 });

    } catch (transactionError) {
      // Rollback on error
      await db.execute('ROLLBACK');
      throw transactionError;
    }

  } catch (error) {
  console.error('❌ Error creating workspace:', error);

  let message = 'Unexpected error';
  if (error instanceof Error) {
    message = error.message;
  }

  return NextResponse.json(
    { 
      error: 'Failed to create workspace',
      details: process.env.NODE_ENV === 'development' ? message : undefined
    },
    { status: 500 }
  );
}

}

// PUT /api/workspaces - Update workspace
export async function PUT(request: NextRequest) {
  let db;
  
  try {
    db = await getConnection();
    const body = await request.json();
    const { id, name, description } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      );
    }

    console.log(`📝 Updating workspace: ${id}`);

    // Check if workspace exists
    const [existingRows] = await db.execute(
      'SELECT id FROM workspaces WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];

    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Update the workspace
    const [result] = await db.execute(
      'UPDATE workspaces SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name.trim(), description || null, id]
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Failed to update workspace' },
        { status: 500 }
      );
    }

    console.log(`✅ Workspace updated successfully`);

    // Fetch and return the updated workspace data
    const updatedWorkspaceData = await buildWorkspaceData(db, id);
    return NextResponse.json(updatedWorkspaceData);

  } catch (error) {
  console.error('❌ Error updating workspace:', error);

  let message = 'Unexpected error';
  if (error instanceof Error) {
    message = error.message;
  }

  return NextResponse.json(
    { 
      error: 'Failed to update workspace',
      details: process.env.NODE_ENV === 'development' ? message : undefined
    },
    { status: 500 }
  );
}

}

// DELETE /api/workspaces - Delete workspace
export async function DELETE(request: NextRequest) {
  let db;
  
  try {
    db = await getConnection();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('id');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting workspace: ${workspaceId}`);

    // Check if workspace exists
    const [existingRows] = await db.execute(
      'SELECT id, name FROM workspaces WHERE id = ?',
      [workspaceId]
    ) as [RowDataPacket[], any];

    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    const workspaceName = existingRows[0].name;

    // Get statistics before deletion
    const [sectionCount] = await db.execute(
      'SELECT COUNT(*) as count FROM sections WHERE workspace_id = ?',
      [workspaceId]
    ) as [RowDataPacket[], any];

    const [pageCount] = await db.execute(
      'SELECT COUNT(*) as count FROM pages WHERE workspace_id = ?',
      [workspaceId]
    ) as [RowDataPacket[], any];

    // Delete workspace (cascading deletes will handle related records)
    const [result] = await db.execute(
      'DELETE FROM workspaces WHERE id = ?',
      [workspaceId]
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Failed to delete workspace' },
        { status: 500 }
      );
    }

    console.log(`✅ Workspace "${workspaceName}" deleted successfully`);
    console.log(`   📊 Removed: ${sectionCount[0].count} sections, ${pageCount[0].count} pages`);

    return NextResponse.json({ 
      success: true, 
      message: `Workspace "${workspaceName}" and all related data deleted successfully`,
      deletedCounts: {
        sections: sectionCount[0].count,
        pages: pageCount[0].count
      }
    });

  } catch (error) {
  console.error('❌ Error deleting workspace:', error);

  let message = 'Unexpected error';
  if (error instanceof Error) {
    message = error.message;
  }

  return NextResponse.json(
    { 
      error: 'Failed to delete workspace',
      details: process.env.NODE_ENV === 'development' ? message : undefined
    },
    { status: 500 }
  );
}

}