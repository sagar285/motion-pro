// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/database";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

// -------- Types --------
interface NotificationData {
  id?: string;
  type: 'page_created' | 'page_updated' | 'page_deleted' | 'section_created' | 'section_updated' | 'member_added' | 'workspace_updated';
  title: string;
  message: string;
  userId?: string;
  workspaceId: string;
  entityId?: string; // ID of the affected page, section, etc.
  entityType?: 'page' | 'section' | 'workspace' | 'member';
  metadata?: Record<string, any>;
}

// -------- Utils --------
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Create notification in database
async function createNotification(db: any, notificationData: NotificationData) {
  const notificationId = generateUUID();
  
  await db.execute(
    `INSERT INTO notifications (
      id, type, title, message, user_id, workspace_id, 
      entity_id, entity_type, metadata, is_read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP)`,
    [
      notificationId,
      notificationData.type,
      notificationData.title,
      notificationData.message,
      notificationData.userId || null,
      notificationData.workspaceId,
      notificationData.entityId || null,
      notificationData.entityType || null,
      JSON.stringify(notificationData.metadata || {})
    ]
  );

  return notificationId;
}

// Get notifications for user/workspace
async function getNotifications(db: any, workspaceId: string, userId?: string, limit: number = 50) {
  let query = `
    SELECT n.*, wm.name as user_name
    FROM notifications n
    LEFT JOIN workspace_members wm ON n.user_id = wm.id
    WHERE n.workspace_id = ?
  `;
  
  const params: any[] = [workspaceId];
  
  if (userId) {
    query += ` AND (n.user_id IS NULL OR n.user_id = ?)`;
    params.push(userId);
  }
  
  query += ` ORDER BY n.created_at DESC LIMIT ?`;
  params.push(limit);
  
  const [rows] = (await db.execute(query, params)) as [RowDataPacket[], any];
  
  return rows.map((row: any) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    userId: row.user_id,
    userName: row.user_name,
    workspaceId: row.workspace_id,
    entityId: row.entity_id,
    entityType: row.entity_type,
    metadata: JSON.parse(row.metadata || '{}'),
    isRead: Boolean(row.is_read),
    timestamp: row.created_at
  }));
}

// -------- API Handlers --------

// GET /api/notifications - Fetch notifications
export async function GET(request: NextRequest) {
  try {
    const db = await getConnection();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    const notifications = await getNotifications(db, workspaceId, userId || undefined, limit);

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch notifications",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const db = await getConnection();
    const body = await request.json();
    const notificationData: NotificationData = body;

    if (!notificationData.workspaceId || !notificationData.type || !notificationData.title) {
      return NextResponse.json({ 
        error: "Workspace ID, type, and title are required" 
      }, { status: 400 });
    }

    const notificationId = await createNotification(db, notificationData);

    // In a real application, you would also emit this to connected WebSocket clients
    // For now, we'll just return the created notification
    const [createdNotification] = await getNotifications(db, notificationData.workspaceId, undefined, 1);

    return NextResponse.json({ 
      success: true, 
      notification: createdNotification[0] || null 
    }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    return NextResponse.json(
      {
        error: "Failed to create notification",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const db = await getConnection();
    const body = await request.json();
    const { notificationIds, markAllAsRead, workspaceId, userId } = body;

    if (markAllAsRead && workspaceId) {
      // Mark all notifications as read for workspace/user
      let query = `UPDATE notifications SET is_read = TRUE WHERE workspace_id = ?`;
      const params: any[] = [workspaceId];
      
      if (userId) {
        query += ` AND (user_id IS NULL OR user_id = ?)`;
        params.push(userId);
      }
      
      await db.execute(query, params);
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      const placeholders = notificationIds.map(() => '?').join(',');
      await db.execute(
        `UPDATE notifications SET is_read = TRUE WHERE id IN (${placeholders})`,
        notificationIds
      );
    } else {
      return NextResponse.json({ 
        error: "Either notificationIds or markAllAsRead with workspaceId is required" 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Error marking notifications as read:", error);
    return NextResponse.json(
      {
        error: "Failed to mark notifications as read",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const db = await getConnection();
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");
    const workspaceId = searchParams.get("workspaceId");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll && workspaceId) {
      // Delete all notifications for workspace
      const [result] = (await db.execute(
        `DELETE FROM notifications WHERE workspace_id = ?`,
        [workspaceId]
      )) as [ResultSetHeader, any];

      return NextResponse.json({ 
        success: true, 
        deletedCount: result.affectedRows 
      }, { status: 200 });
    } else if (notificationId) {
      // Delete specific notification
      const [result] = (await db.execute(
        `DELETE FROM notifications WHERE id = ?`,
        [notificationId]
      )) as [ResultSetHeader, any];

      if (result.affectedRows === 0) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ 
        error: "Either notification ID or workspace ID with clearAll=true is required" 
      }, { status: 400 });
    }
  } catch (error) {
    console.error("❌ Error deleting notifications:", error);
    return NextResponse.json(
      {
        error: "Failed to delete notifications",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

// -------- Notification Helper Functions --------

// Helper function to create notifications for different actions
export async function notifyPageCreated(workspaceId: string, pageTitle: string, userName: string, userId?: string) {
  const notificationData: NotificationData = {
    type: 'page_created',
    title: 'New page created',
    message: `"${pageTitle}" page was created${userName ? ` by ${userName}` : ''}`,
    workspaceId,
    userId,
    entityType: 'page'
  };

  const response = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationData)
  });

  return response.json();
}

export async function notifyPageUpdated(workspaceId: string, pageTitle: string, userName: string, userId?: string) {
  const notificationData: NotificationData = {
    type: 'page_updated',
    title: 'Page updated',
    message: `"${pageTitle}" page was updated${userName ? ` by ${userName}` : ''}`,
    workspaceId,
    userId,
    entityType: 'page'
  };

  const response = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationData)
  });

  return response.json();
}

export async function notifyPageDeleted(workspaceId: string, pageTitle: string, userName: string, userId?: string) {
  const notificationData: NotificationData = {
    type: 'page_deleted',
    title: 'Page deleted',
    message: `"${pageTitle}" page was deleted${userName ? ` by ${userName}` : ''}`,
    workspaceId,
    userId,
    entityType: 'page'
  };

  const response = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationData)
  });

  return response.json();
}

export async function notifySectionUpdated(workspaceId: string, sectionTitle: string, action: string, userName: string, userId?: string) {
  const notificationData: NotificationData = {
    type: 'section_updated',
    title: 'Section updated',
    message: `"${sectionTitle}" section was ${action}${userName ? ` by ${userName}` : ''}`,
    workspaceId,
    userId,
    entityType: 'section'
  };

  const response = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationData)
  });

  return response.json();
}