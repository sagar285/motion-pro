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

// GET /api/pages - Get pages or specific page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('id');
    const sectionId = searchParams.get('sectionId');
    const subsectionId = searchParams.get('subsectionId');
    const parentId = searchParams.get('parentId');
    const db = await getConnection();

    if (pageId) {
      console.log('📄 Fetching specific page:', pageId);
      
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
        // Transform database field names to frontend format
        parentId: page.parent_id,
        sectionId: page.section_id,
        subsectionId: page.subsection_id,
        workspaceId: page.workspace_id,
        createdAt: page.created_at,
        updatedAt: page.updated_at,
        assignees: page.assignees ? JSON.parse(page.assignees) : [],
        properties: page.properties ? JSON.parse(page.properties) : {},
        content: blockRows.map(block => ({
          ...block,
          pageId: block.page_id,
          parentBlockId: block.parent_block_id,
          createdAt: block.created_at,
          updatedAt: block.updated_at,
          metadata: block.metadata ? JSON.parse(block.metadata) : {},
          order: block.block_order
        }))
      };

      console.log('✅ Page fetched successfully');
      return NextResponse.json(result);
    } else {
      // Get pages by section/subsection/parent with enhanced filtering
      let query = 'SELECT * FROM pages';
      let params: any[] = [];
      let whereConditions: string[] = [];

      if (parentId) {
        console.log('📄 Fetching child pages for parent:', parentId);
        whereConditions.push('parent_id = ?');
        params.push(parentId);
      } else if (subsectionId) {
        console.log('📄 Fetching root pages for subsection:', subsectionId);
        whereConditions.push('subsection_id = ? AND parent_id IS NULL');
        params.push(subsectionId);
      } else if (sectionId) {
        console.log('📄 Fetching root pages for section:', sectionId);
        whereConditions.push('section_id = ? AND subsection_id IS NULL AND parent_id IS NULL');
        params.push(sectionId);
      }

      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      query += ' ORDER BY page_order ASC, created_at ASC';

      const [pageRows] = await db.execute(query, params) as [RowDataPacket[], any];

      const pages = [];
      for (const page of pageRows) {
        // Get content blocks for each page (optional - can be heavy)
        const [blockRows] = await db.execute(
          'SELECT id, type, content FROM content_blocks WHERE page_id = ? ORDER BY block_order LIMIT 5',
          [page.id]
        ) as [RowDataPacket[], any];

        pages.push({
          ...page,
          // Transform database field names to frontend format
          parentId: page.parent_id,
          sectionId: page.section_id,
          subsectionId: page.subsection_id,
          workspaceId: page.workspace_id,
          createdAt: page.created_at,
          updatedAt: page.updated_at,
          assignees: page.assignees ? JSON.parse(page.assignees) : [],
          properties: page.properties ? JSON.parse(page.properties) : {},
          content: blockRows.map(block => ({
            ...block,
            pageId: block.page_id,
            metadata: block.metadata ? JSON.parse(block.metadata) : {}
          }))
        });
      }

      console.log(`✅ Fetched ${pages.length} pages successfully`);
      return NextResponse.json(pages);
    }
  } catch (error) {
    console.error('❌ Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/pages - Create new page with enhanced nested support
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Creating page with data:', JSON.stringify(body, null, 2));
    
    const { 
      workspaceId, 
      sectionId, 
      subsectionId, 
      parentId,
      title, 
      icon = '📄', 
      type = 'page',
      status,
      assignees = [],
      deadline,
      properties = {},
      order
    } = body;

    // Enhanced validation
    if (!workspaceId || !title?.trim()) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Workspace ID and title are required' },
        { status: 400 }
      );
    }

    // For root pages, sectionId is required
    if (!parentId && !sectionId) {
      console.error('❌ Missing sectionId for root page');
      return NextResponse.json(
        { error: 'Section ID is required for root pages' },
        { status: 400 }
      );
    }

    const db = await getConnection();

    
    const pageId = generateUUID();
    console.log('🔄 Generated page ID:', pageId);

    // Start transaction for data consistency
    await db.beginTransaction();

    try {
      // If this is a child page, inherit section/subsection from parent
      let finalSectionId = sectionId;
      let finalSubsectionId = subsectionId;

      if (parentId) {
        console.log('🔍 Getting parent info for:', parentId);
        const [parentRows] = await db.execute(
          'SELECT section_id, subsection_id FROM pages WHERE id = ?',
          [parentId]
        ) as [RowDataPacket[], any];

        if (parentRows.length === 0) {
          await db.rollback();
          console.error('❌ Parent page not found');
          return NextResponse.json(
            { error: 'Parent page not found' },
            { status: 404 }
          );
        }

        const parentData = parentRows[0];
        finalSectionId = finalSectionId || parentData.section_id;
        finalSubsectionId = finalSubsectionId || parentData.subsection_id;
        
        console.log('✅ Inherited from parent - section:', finalSectionId, 'subsection:', finalSubsectionId);
      }

      // Validate workspace exists
      const [workspaceRows] = await db.execute(
        'SELECT id FROM workspaces WHERE id = ?',
        [workspaceId]
      ) as [RowDataPacket[], any];

      if (workspaceRows.length === 0) {
        await db.rollback();
        console.error('❌ Workspace not found:', workspaceId);
        return NextResponse.json(
          { error: 'Workspace not found' },
          { status: 404 }
        );
      }

      // Validate section exists
      if (!finalSectionId) {
        await db.rollback();
        console.error('❌ No section ID determined');
        return NextResponse.json(
          { error: 'Section ID is required for all pages' },
          { status: 400 }
        );
      }

      const [sectionRows] = await db.execute(
        'SELECT id FROM sections WHERE id = ? AND workspace_id = ?',
        [finalSectionId, workspaceId]
      ) as [RowDataPacket[], any];

      if (sectionRows.length === 0) {
        await db.rollback();
        console.error('❌ Section not found or does not belong to workspace');
        return NextResponse.json(
          { error: 'Section not found or does not belong to workspace' },
          { status: 404 }
        );
      }

      // Validate subsection if provided
      if (finalSubsectionId) {
        const [subsectionRows] = await db.execute(
          'SELECT id FROM subsections WHERE id = ? AND section_id = ?',
          [finalSubsectionId, finalSectionId]
        ) as [RowDataPacket[], any];

        if (subsectionRows.length === 0) {
          await db.rollback();
          console.error('❌ Subsection not found or does not belong to section');
          return NextResponse.json(
            { error: 'Subsection not found or does not belong to section' },
            { status: 404 }
          );
        }
      }

      // Calculate page order if not provided
      let pageOrder = order || 0;
      if (order === undefined) {
        let orderQuery: string;
        let orderParams: any[];

        if (parentId) {
          // For child pages, find max order among siblings
          orderQuery = 'SELECT COALESCE(MAX(page_order), -1) as maxOrder FROM pages WHERE parent_id = ?';
          orderParams = [parentId];
        } else if (finalSubsectionId) {
          // For subsection root pages
          orderQuery = 'SELECT COALESCE(MAX(page_order), -1) as maxOrder FROM pages WHERE subsection_id = ? AND parent_id IS NULL';
          orderParams = [finalSubsectionId];
        } else {
          // For section root pages
          orderQuery = 'SELECT COALESCE(MAX(page_order), -1) as maxOrder FROM pages WHERE section_id = ? AND subsection_id IS NULL AND parent_id IS NULL';
          orderParams = [finalSectionId];
        }

        const [orderRows] = await db.execute(orderQuery, orderParams) as [RowDataPacket[], any];
        pageOrder = (orderRows[0]?.maxOrder || -1) + 1;
      }

      console.log('📊 Final page data:', {
        pageId,
        workspaceId,
        finalSectionId,
        finalSubsectionId,
        parentId,
        title: title.trim(),
        pageOrder
      });

      // Create the page
      await db.execute(`
        INSERT INTO pages (
          id, workspace_id, section_id, subsection_id, parent_id, 
          title, icon, type, status, assignees, deadline, properties, page_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        pageId,
        workspaceId,
        finalSectionId,
        finalSubsectionId || null,
        parentId || null,
        title.trim(),
        icon,
        type,
        status || null,
        JSON.stringify(assignees),
        deadline || null,
        JSON.stringify(properties),
        pageOrder
      ]);

      // Commit transaction
      await db.commit();
      console.log('✅ Page created and transaction committed');

      // Get the created page with transformed format
      const [rows] = await db.execute(
        'SELECT * FROM pages WHERE id = ?',
        [pageId]
      ) as [RowDataPacket[], any];

      if (rows.length === 0) {
        console.error('❌ Failed to retrieve created page');
        return NextResponse.json(
          { error: 'Failed to retrieve created page' },
          { status: 500 }
        );
      }

      const newPage = {
        ...rows[0],
        // Transform database field names to frontend format
        parentId: rows[0].parent_id,
        sectionId: rows[0].section_id,
        subsectionId: rows[0].subsection_id,
        workspaceId: rows[0].workspace_id,
        assignees: rows[0].assignees ? JSON.parse(rows[0].assignees) : [],
        properties: rows[0].properties ? JSON.parse(rows[0].properties) : {},
        content: [],
        createdAt: new Date(rows[0].created_at),
        updatedAt: new Date(rows[0].updated_at)
      };

      console.log('🎉 Page creation completed successfully:', newPage.title);
      return NextResponse.json(newPage, { status: 201 });

    } catch (transactionError) {
      await db.rollback();
      console.error('❌ Transaction error:', transactionError);
      throw transactionError;
    }
  } catch (error) {
    console.error('❌ Error creating page:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/pages - Update page with enhanced nested support
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('✏️ Updating page with data:', JSON.stringify(body, null, 2));
    
    const { 
      id, 
      title, 
      icon, 
      type, 
      status, 
      assignees, 
      deadline, 
      properties,
      parentId,
      order,
      sectionId,
      subsectionId
    } = body;

    if (!id) {
      console.error('❌ Missing page ID');
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    const db = await getConnection();
    
    // Start transaction
    await db.beginTransaction();

    try {
      // Check if page exists
      const [existingRows] = await db.execute(
        'SELECT * FROM pages WHERE id = ?',
        [id]
      ) as [RowDataPacket[], any];

      if (existingRows.length === 0) {
        await db.rollback();
        console.error('❌ Page not found:', id);
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        );
      }

      const currentPage = existingRows[0];
      console.log('✅ Found existing page:', currentPage.title);

      // Enhanced parent validation to prevent circular references
      if (parentId !== undefined && parentId !== currentPage.parent_id) {
        if (parentId === id) {
          await db.rollback();
          console.error('❌ Circular reference: page cannot be its own parent');
          return NextResponse.json(
            { error: 'Page cannot be its own parent' },
            { status: 400 }
          );
        }

        // Check for circular references
        if (parentId) {
          const isCircular = await checkCircularReference(db, id, parentId);
          if (isCircular) {
            await db.rollback();
            console.error('❌ Circular reference detected');
            return NextResponse.json(
              { error: 'This would create a circular reference' },
              { status: 400 }
            );
          }
        }
      }

      // If parent is changing, inherit section/subsection from new parent
      let finalSectionId = sectionId !== undefined ? sectionId : currentPage.section_id;
      let finalSubsectionId = subsectionId !== undefined ? subsectionId : currentPage.subsection_id;

      if (parentId !== undefined && parentId !== currentPage.parent_id && parentId) {
        console.log('🔍 Getting new parent info for inheritance');
        const [parentRows] = await db.execute(
          'SELECT section_id, subsection_id FROM pages WHERE id = ?',
          [parentId]
        ) as [RowDataPacket[], any];

        if (parentRows.length > 0) {
          // Only inherit if not explicitly provided
          if (sectionId === undefined) finalSectionId = parentRows[0].section_id;
          if (subsectionId === undefined) finalSubsectionId = parentRows[0].subsection_id;
          console.log('✅ Inherited from new parent');
        }
      }

      // Validate section exists if changed
      if (finalSectionId && finalSectionId !== currentPage.section_id) {
        const [sectionRows] = await db.execute(
          'SELECT id FROM sections WHERE id = ?',
          [finalSectionId]
        ) as [RowDataPacket[], any];

        if (sectionRows.length === 0) {
          await db.rollback();
          console.error('❌ Section not found:', finalSectionId);
          return NextResponse.json(
            { error: 'Section not found' },
            { status: 404 }
          );
        }
      }

      // Validate subsection exists if changed
      if (finalSubsectionId && finalSubsectionId !== currentPage.subsection_id) {
        const [subsectionRows] = await db.execute(
          'SELECT id FROM subsections WHERE id = ? AND section_id = ?',
          [finalSubsectionId, finalSectionId]
        ) as [RowDataPacket[], any];

        if (subsectionRows.length === 0) {
          await db.rollback();
          console.error('❌ Subsection validation failed');
          return NextResponse.json(
            { error: 'Subsection not found or does not belong to section' },
            { status: 404 }
          );
        }
      }
      
      // Build dynamic update query
      const updates = [];
      const params = [];
      
      if (title !== undefined && title.trim()) {
        updates.push('title = ?');
        params.push(title.trim());
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
      if (parentId !== undefined) {
        updates.push('parent_id = ?');
        params.push(parentId);
      }
      if (finalSectionId !== undefined && finalSectionId !== currentPage.section_id) {
        updates.push('section_id = ?');
        params.push(finalSectionId);
      }
      if (finalSubsectionId !== undefined && finalSubsectionId !== currentPage.subsection_id) {
        updates.push('subsection_id = ?');
        params.push(finalSubsectionId);
      }
      if (order !== undefined) {
        updates.push('page_order = ?');
        params.push(order);
      }
      
      if (updates.length === 0) {
        await db.rollback();
        console.error('❌ No fields to update');
        return NextResponse.json(
          { error: 'No fields to update' },
          { status: 400 }
        );
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      console.log('📊 Executing update with:', updates.length, 'fields');

      const [result] = await db.execute(
        `UPDATE pages SET ${updates.join(', ')} WHERE id = ?`,
        params
      ) as [ResultSetHeader, any];

      if (result.affectedRows === 0) {
        await db.rollback();
        console.error('❌ No rows affected during update');
        return NextResponse.json(
          { error: 'Page not found or no changes made' },
          { status: 404 }
        );
      }

      // Commit transaction
      await db.commit();
      console.log('✅ Page updated and transaction committed');

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
        id: pageRows[0].id,
        title: pageRows[0].title,
        icon: pageRows[0].icon,
        type: pageRows[0].type,
        status: pageRows[0].status,
        deadline: pageRows[0].deadline,
        parentId: pageRows[0].parent_id,
        sectionId: pageRows[0].section_id,
        subsectionId: pageRows[0].subsection_id,
        workspaceId: pageRows[0].workspace_id,
        assignees: pageRows[0].assignees ? JSON.parse(pageRows[0].assignees) : [],
        properties: pageRows[0].properties ? JSON.parse(pageRows[0].properties) : {},
        createdAt: new Date(pageRows[0].created_at),
        updatedAt: new Date(pageRows[0].updated_at),
        content: blockRows.map(block => ({
          id: block.id,
          type: block.type,
          content: block.content,
          pageId: block.page_id,
          parentBlockId: block.parent_block_id,
          createdAt: block.created_at,
          updatedAt: block.updated_at,
          metadata: block.metadata ? JSON.parse(block.metadata) : {},
          order: block.block_order
        }))
      };

      console.log('🎉 Page update completed successfully');
      return NextResponse.json(updatedPage);
      
    } catch (transactionError) {
      await db.rollback();
      console.error('❌ Transaction error during update:', transactionError);
      throw transactionError;
    }
  } catch (error) {
    console.error('❌ Error updating page:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/pages - Delete page and all children recursively
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('id');
    const deleteChildren = searchParams.get('deleteChildren') !== 'false'; // Default true

    if (!pageId) {
      console.error('❌ Missing page ID for deletion');
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    const db = await getConnection();
    console.log('🗑️ Starting deletion process for page:', pageId);

    // Start transaction
    await db.beginTransaction();

    try {
      // Check if page exists
      const [pageExists] = await db.execute(
        'SELECT id, title FROM pages WHERE id = ?',
        [pageId]
      ) as [RowDataPacket[], any];

      if (pageExists.length === 0) {
        await db.rollback();
        console.error('❌ Page not found for deletion:', pageId);
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        );
      }

      const pageTitle = pageExists[0].title;
      console.log('✅ Found page to delete:', pageTitle);

      let allPageIds: string[] = [pageId];

      if (deleteChildren) {
        // Get all child page IDs recursively
        const childIds = await getAllChildPageIdsRecursive(db, pageId);
        allPageIds = childIds; // This already includes the parent page
        console.log(`📊 Found ${allPageIds.length - 1} child pages to delete`);
      }

      console.log(`🗑️ Deleting ${allPageIds.length} pages total`);

      // Delete in correct order due to foreign key constraints
      
      // 1. Delete content blocks
      if (allPageIds.length > 0) {
        const placeholders = allPageIds.map(() => '?').join(',');
        const [blockResult] = await db.execute(
          `DELETE FROM content_blocks WHERE page_id IN (${placeholders})`,
          allPageIds
        ) as [ResultSetHeader, any];
        console.log(`✅ Deleted ${blockResult.affectedRows} content blocks`);
      }

      // 2. Delete comments
      if (allPageIds.length > 0) {
        const placeholders = allPageIds.map(() => '?').join(',');
        const [commentResult] = await db.execute(
          `DELETE FROM comments WHERE page_id IN (${placeholders})`,
          allPageIds
        ) as [ResultSetHeader, any];
        console.log(`✅ Deleted ${commentResult.affectedRows} comments`);
      }

      // 3. Delete page files
      if (allPageIds.length > 0) {
        const placeholders = allPageIds.map(() => '?').join(',');
        const [fileResult] = await db.execute(
          `DELETE FROM page_files WHERE page_id IN (${placeholders})`,
          allPageIds
        ) as [ResultSetHeader, any];
        console.log(`✅ Deleted ${fileResult.affectedRows} page files`);
      }

      // 4. Delete pages in reverse depth order (children first)
      const sortedPageIds = await sortPagesByDepth(db, allPageIds);
      
      let deletedCount = 0;
      for (const pageIdToDelete of sortedPageIds) {
        const [deleteResult] = await db.execute(
          'DELETE FROM pages WHERE id = ?', 
          [pageIdToDelete]
        ) as [ResultSetHeader, any];
        deletedCount += deleteResult.affectedRows;
      }

      await db.commit();
      console.log(`🎉 Successfully deleted ${deletedCount} pages`);

      return NextResponse.json({ 
        success: true, 
        deletedCount: allPageIds.length,
        deletedIds: allPageIds 
      });
      
    } catch (deleteError) {
      await db.rollback();
      console.error('❌ Deletion transaction error:', deleteError);
      throw deleteError;
    }
  } catch (error) {
    console.error('❌ Error deleting page:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to get all child page IDs recursively
async function getAllChildPageIdsRecursive(db: any, parentId: string): Promise<string[]> {
  const allIds = [parentId];
  const toProcess = [parentId];
  const processed = new Set<string>();
  
  while (toProcess.length > 0) {
    const currentId = toProcess.shift()!;
    
    if (processed.has(currentId)) {
      continue; // Prevent infinite loops
    }
    processed.add(currentId);
    
    const [childRows] = await db.execute(
      'SELECT id FROM pages WHERE parent_id = ?',
      [currentId]
    ) as [RowDataPacket[], any];

    for (const row of childRows) {
      const childId = row.id;
      if (!allIds.includes(childId)) {
        allIds.push(childId);
        toProcess.push(childId);
      }
    }
  }
  
  return allIds;
}

// Helper function to sort pages by depth (deepest first for deletion)
async function sortPagesByDepth(db: any, pageIds: string[]): Promise<string[]> {
  const pageDepths: { id: string; depth: number }[] = [];
  
  for (const pageId of pageIds) {
    const depth = await getPageDepth(db, pageId);
    pageDepths.push({ id: pageId, depth });
  }
  
  // Sort by depth descending (deepest first)
  return pageDepths
    .sort((a, b) => b.depth - a.depth)
    .map(item => item.id);
}

// Helper function to get page depth
async function getPageDepth(db: any, pageId: string): Promise<number> {
  let depth = 0;
  let currentId = pageId;
  
  while (currentId) {
    const [parentRows] = await db.execute(
      'SELECT parent_id FROM pages WHERE id = ?',
      [currentId]
    ) as [RowDataPacket[], any];
    
    if (parentRows.length === 0 || !parentRows[0].parent_id) {
      break;
    }
    
    currentId = parentRows[0].parent_id;
    depth++;
    
    // Safety check to prevent infinite loops
    if (depth > 50) {
      console.warn(`Possible circular reference detected for page ${pageId}`);
      break;
    }
  }
  
  return depth;
}

// Helper function to check circular references
async function checkCircularReference(db: any, pageId: string, newParentId: string): Promise<boolean> {
  try {
    // Get all descendants of the page being moved
    const descendants = await getAllChildPageIdsRecursive(db, pageId);
    
    // If the new parent is among the descendants, it would create a circular reference
    return descendants.includes(newParentId);
  } catch (error) {
    console.error('Error checking circular reference:', error);
    return true; // Safe default - prevent the move
  }
}