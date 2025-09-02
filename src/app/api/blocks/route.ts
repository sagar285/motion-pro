import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import { createNotification } from '@/lib/notifications';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Utility function to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to get user ID from request
async function getCurrentUserId(request: NextRequest): Promise<number | null> {
  const userIdFromMiddleware = request.headers.get('user-id');
  if (userIdFromMiddleware) {
    const userId = parseInt(userIdFromMiddleware);
    return !isNaN(userId) ? userId : null;
  }
  return 1; // Default user for testing - implement proper auth
}

// GET /api/blocks - Get content blocks for a page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const blockId = searchParams.get('id');
    const db = await getConnection();

    if (blockId) {
      // Get specific block
      const [rows] = await db.execute(
        'SELECT * FROM content_blocks WHERE id = ?',
        [blockId]
      ) as [RowDataPacket[], any];

      if (rows.length === 0) {
        return NextResponse.json(
          { error: 'Block not found' },
          { status: 404 }
        );
      }

      const block = {
        ...rows[0],
        metadata: rows[0].metadata ? JSON.parse(rows[0].metadata) : {},
        order: rows[0].block_order
      };

      return NextResponse.json(block);
    } else if (pageId) {
      // Get all blocks for a page
      const [rows] = await db.execute(
        'SELECT * FROM content_blocks WHERE page_id = ? ORDER BY block_order',
        [pageId]
      ) as [RowDataPacket[], any];

      const blocks = rows.map(block => ({
        ...block,
        metadata: block.metadata ? JSON.parse(block.metadata) : {},
        order: block.block_order
      }));

      return NextResponse.json(blocks);
    } else {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/blocks - Create new content block
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, type, content = '', metadata = {}, order, insertAfter } = body;

    if (!pageId || !type) {
      return NextResponse.json(
        { error: 'Page ID and type are required' },
        { status: 400 }
      );
    }

    const db = await getConnection();
    const currentUserId = await getCurrentUserId(request);

    // Get page and workspace info for notification
    const [pageRows] = await db.execute(
      `SELECT p.title as page_title, p.workspace_id, w.name as workspace_name, s.title as section_name
       FROM pages p 
       JOIN workspaces w ON p.workspace_id = w.id 
       LEFT JOIN sections s ON p.section_id = s.id 
       WHERE p.id = ?`,
      [pageId]
    ) as [RowDataPacket[], any];

    if (pageRows.length === 0) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    const pageData = pageRows[0];
    let blockOrder = order || 0;

    // If insertAfter is provided, find the order of that block and increment all subsequent blocks
    if (insertAfter) {
      const [afterBlockRows] = await db.execute(
        'SELECT block_order FROM content_blocks WHERE id = ?',
        [insertAfter]
      ) as [RowDataPacket[], any];

      if (afterBlockRows.length > 0) {
        blockOrder = afterBlockRows[0].block_order + 1;
        
        // Increment order of all blocks that come after the insertAfter block
        await db.execute(
          'UPDATE content_blocks SET block_order = block_order + 1, updated_at = CURRENT_TIMESTAMP WHERE page_id = ? AND block_order >= ?',
          [pageId, blockOrder]
        );
      }
    } else if (order === undefined) {
      // If no order specified, add at the end
      const [maxOrderRows] = await db.execute(
        'SELECT MAX(block_order) as maxOrder FROM content_blocks WHERE page_id = ?',
        [pageId]
      ) as [RowDataPacket[], any];
      
      blockOrder = maxOrderRows[0].maxOrder !== null ? maxOrderRows[0].maxOrder + 1 : 0;
    }

    const blockId = generateUUID();

    const [result] = await db.execute(`
      INSERT INTO content_blocks (id, page_id, type, content, metadata, block_order) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      blockId,
      pageId,
      type,
      content,
      JSON.stringify(metadata),
      blockOrder
    ]) as [ResultSetHeader, any];

    console.log(`✅ Content block (${type}) created in page "${pageData.page_title}"`);

    // 🔔 SEND NOTIFICATION TO WORKSPACE MEMBERS (only for significant content types)
    const notifiableTypes = ['text', 'heading', 'image', 'file', 'embed', 'database'];
    if (currentUserId && notifiableTypes.includes(type)) {
      const location = pageData.section_name ? ` in section "${pageData.section_name}"` : '';
      await createNotification({
        type: 'page_updated',
        title: 'Content Added',
        message: `New ${type} content was added to page "${pageData.page_title}"${location} in workspace "${pageData.workspace_name}"`,
        workspace_id: pageData.workspace_id,
        created_by: currentUserId,
        metadata: { 
          pageName: pageData.page_title,
          pageId: pageId,
          workspaceName: pageData.workspace_name,
          sectionName: pageData.section_name,
          contentType: type,
          blockId: blockId
        }
      });
    }

    // Get the created block
    const [rows] = await db.execute(
      'SELECT * FROM content_blocks WHERE id = ?',
      [blockId]
    ) as [RowDataPacket[], any];

    const newBlock = {
      ...rows[0],
      metadata: rows[0].metadata ? JSON.parse(rows[0].metadata) : {},
      order: rows[0].block_order
    };

    return NextResponse.json(newBlock, { status: 201 });
  } catch (error) {
    console.error('Error creating block:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/blocks - Update content block
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, type, metadata, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Block ID is required' },
        { status: 400 }
      );
    }

    const db = await getConnection();
    const currentUserId = await getCurrentUserId(request);

    // Get current block data and page/workspace info
    const [currentBlockRows] = await db.execute(
      `SELECT cb.*, p.title as page_title, p.workspace_id, w.name as workspace_name, s.title as section_name
       FROM content_blocks cb
       JOIN pages p ON cb.page_id = p.id
       JOIN workspaces w ON p.workspace_id = w.id 
       LEFT JOIN sections s ON p.section_id = s.id 
       WHERE cb.id = ?`,
      [id]
    ) as [RowDataPacket[], any];

    if (currentBlockRows.length === 0) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    const currentBlock = currentBlockRows[0];
    
    // Build dynamic update query and track significant changes
    const updates = [];
    const params = [];
    const changes: Record<string, any> = {};
    
    if (content !== undefined && content !== currentBlock.content) {
      updates.push('content = ?');
      params.push(content);
      changes.content = { from: currentBlock.content, to: content };
    }
    if (type !== undefined && type !== currentBlock.type) {
      updates.push('type = ?');
      params.push(type);
      changes.type = { from: currentBlock.type, to: type };
    }
    if (metadata !== undefined) {
      const currentMetadata = currentBlock.metadata ? JSON.parse(currentBlock.metadata) : {};
      if (JSON.stringify(metadata) !== JSON.stringify(currentMetadata)) {
        updates.push('metadata = ?');
        params.push(JSON.stringify(metadata));
        changes.metadata = { from: currentMetadata, to: metadata };
      }
    }
    if (order !== undefined && order !== currentBlock.block_order) {
      updates.push('block_order = ?');
      params.push(order);
      changes.order = { from: currentBlock.block_order, to: order };
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No changes detected' },
        { status: 400 }
      );
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const [result] = await db.execute(
      `UPDATE content_blocks SET ${updates.join(', ')} WHERE id = ?`,
      params
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Content block updated in page "${currentBlock.page_title}"`);

    // 🔔 SEND NOTIFICATION TO WORKSPACE MEMBERS (only for significant content changes)
    const significantChanges = ['content', 'type'];
    const hasSignificantChanges = significantChanges.some(change => changes[change]);
    
    if (currentUserId && hasSignificantChanges) {
      const location = currentBlock.section_name ? ` in section "${currentBlock.section_name}"` : '';
      const changeType = changes.content ? 'content updated' : changes.type ? 'block type changed' : 'updated';
      
      await createNotification({
        type: 'page_updated',
        title: 'Page Content Updated',
        message: `Content was ${changeType} in page "${currentBlock.page_title}"${location} in workspace "${currentBlock.workspace_name}"`,
        workspace_id: currentBlock.workspace_id,
        created_by: currentUserId,
        metadata: { 
          pageName: currentBlock.page_title,
          pageId: currentBlock.page_id,
          workspaceName: currentBlock.workspace_name,
          sectionName: currentBlock.section_name,
          blockType: type || currentBlock.type,
          blockId: id,
          changes: changes
        }
      });
    }

    // Get the updated block
    const [rows] = await db.execute(
      'SELECT * FROM content_blocks WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];

    const updatedBlock = {
      ...rows[0],
      metadata: rows[0].metadata ? JSON.parse(rows[0].metadata) : {},
      order: rows[0].block_order
    };

    return NextResponse.json(updatedBlock);
  } catch (error) {
    console.error('Error updating block:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/blocks - Delete content block
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('id');

    if (!blockId) {
      return NextResponse.json(
        { error: 'Block ID is required' },
        { status: 400 }
      );
    }

    const db = await getConnection();
    const currentUserId = await getCurrentUserId(request);

    // Get block data and page/workspace info before deletion
    const [blockRows] = await db.execute(
      `SELECT cb.*, p.title as page_title, p.workspace_id, w.name as workspace_name, s.title as section_name
       FROM content_blocks cb
       JOIN pages p ON cb.page_id = p.id
       JOIN workspaces w ON p.workspace_id = w.id 
       LEFT JOIN sections s ON p.section_id = s.id 
       WHERE cb.id = ?`,
      [blockId]
    ) as [RowDataPacket[], any];

    if (blockRows.length === 0) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    const blockData = blockRows[0];

    // Delete the block
    await db.execute('DELETE FROM content_blocks WHERE id = ?', [blockId]);

    // Reorder remaining blocks (decrement order for blocks that came after the deleted block)
    await db.execute(
      'UPDATE content_blocks SET block_order = block_order - 1, updated_at = CURRENT_TIMESTAMP WHERE page_id = ? AND block_order > ?',
      [blockData.page_id, blockData.block_order]
    );

    console.log(`✅ Content block (${blockData.type}) deleted from page "${blockData.page_title}"`);

    // 🔔 SEND NOTIFICATION TO WORKSPACE MEMBERS (only for significant content deletions)
    const significantTypes = ['text', 'heading', 'image', 'file', 'embed', 'database'];
    if (currentUserId && significantTypes.includes(blockData.type)) {
      const location = blockData.section_name ? ` in section "${blockData.section_name}"` : '';
      await createNotification({
        type: 'page_updated',
        title: 'Content Removed',
        message: `${blockData.type} content was removed from page "${blockData.page_title}"${location} in workspace "${blockData.workspace_name}"`,
        workspace_id: blockData.workspace_id,
        created_by: currentUserId,
        metadata: { 
          pageName: blockData.page_title,
          pageId: blockData.page_id,
          workspaceName: blockData.workspace_name,
          sectionName: blockData.section_name,
          deletedBlockType: blockData.type
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting block:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}