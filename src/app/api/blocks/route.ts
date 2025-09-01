// app/api/blocks/route.ts - Fixed blocks API with proper exports
import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
    }
    if (metadata !== undefined) {
      updates.push('metadata = ?');
      params.push(JSON.stringify(metadata));
    }
    if (order !== undefined) {
      updates.push('block_order = ?');
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
      `UPDATE content_blocks SET ${updates.join(', ')} WHERE id = ?`,
      params
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
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

    // Get the block to find its order and pageId before deletion
    const [blockRows] = await db.execute(
      'SELECT page_id, block_order FROM content_blocks WHERE id = ?',
      [blockId]
    ) as [RowDataPacket[], any];

    if (blockRows.length === 0) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    const { page_id: pageId, block_order: blockOrder } = blockRows[0];

    // Delete the block
    await db.execute('DELETE FROM content_blocks WHERE id = ?', [blockId]);

    // Reorder remaining blocks (decrement order for blocks that came after the deleted block)
    await db.execute(
      'UPDATE content_blocks SET block_order = block_order - 1, updated_at = CURRENT_TIMESTAMP WHERE page_id = ? AND block_order > ?',
      [pageId, blockOrder]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting block:', error);
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