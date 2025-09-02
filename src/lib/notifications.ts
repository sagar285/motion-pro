// lib/notifications.ts
import { getConnection } from './database';
import { sendNotificationEmail } from './email';
import { getUserById } from './auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Types
export interface Notification {
  id: string;
  user_id: number;
  workspace_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  is_email_sent: boolean;
  created_by?: number;
  created_at: Date;
  read_at?: Date;
}

export interface NotificationPreferences {
  user_id: number;
  email_notifications: boolean;
  workspace_changes: boolean;
  page_changes: boolean;
  comments: boolean;
  assignments: boolean;
  daily_digest: boolean;
}

export type NotificationType = 
  | 'workspace_created'
  | 'workspace_updated' 
  | 'workspace_deleted'
  | 'page_created'
  | 'page_updated'
  | 'page_deleted'
  | 'section_created'
  | 'section_updated'
  | 'section_deleted'
  | 'member_added'
  | 'member_removed'
  | 'comment_added'
  | 'assignment_changed';

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  workspace_id?: string;
  metadata?: Record<string, any>;
  created_by?: number;
  target_users?: number[]; // Specific users, if not provided will notify all workspace members
}

// Utility functions
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get notification preferences for a user
export async function getUserNotificationPreferences(userId: number): Promise<NotificationPreferences | null> {
  const db = await getConnection();
  
  try {
    const [rows] = await db.execute<(NotificationPreferences & RowDataPacket)[]>(
      'SELECT * FROM notification_preferences WHERE user_id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      // Create default preferences if none exist
      await db.execute(
        `INSERT INTO notification_preferences (user_id, email_notifications, workspace_changes, page_changes, comments, assignments, daily_digest) 
         VALUES (?, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE)`,
        [userId]
      );
      
      return {
        user_id: userId,
        email_notifications: true,
        workspace_changes: true,
        page_changes: true,
        comments: true,
        assignments: true,
        daily_digest: false
      };
    }
    
    return rows[0];
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    return null;
  }
}

// Update notification preferences
export async function updateNotificationPreferences(
  userId: number, 
  preferences: Partial<Omit<NotificationPreferences, 'user_id'>>
): Promise<boolean> {
  const db = await getConnection();
  
  try {
    const updates: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(preferences)) {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (updates.length === 0) return false;
    
    values.push(userId);
    
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE notification_preferences SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return false;
  }
}

// Get all workspace members (for notifications)
export async function getWorkspaceMembers(workspaceId: string): Promise<number[]> {
  const db = await getConnection();
  
  try {
    // First try to get from workspace_members table
    const [memberRows] = await db.execute<RowDataPacket[]>(
      'SELECT email FROM workspace_members WHERE workspace_id = ?',
      [workspaceId]
    );
    
    if (memberRows.length > 0) {
      // Get user IDs from emails
      const emails = memberRows.map(row => row.email);
      const placeholders = emails.map(() => '?').join(',');
      
      const [userRows] = await db.execute<RowDataPacket[]>(
        `SELECT id FROM users WHERE email IN (${placeholders})`,
        emails
      );
      
      return userRows.map(row => row.id);
    }
    
    // Fallback: notify all users (for basic setup)
    const [allUsers] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email_verified = TRUE'
    );
    
    return allUsers.map(row => row.id);
  } catch (error) {
    console.error('Failed to get workspace members:', error);
    return [];
  }
}

// Create notification for specific users
export async function createNotification(data: CreateNotificationData): Promise<boolean> {
  const db = await getConnection();
  
  try {
    let targetUsers = data.target_users;
    
    // If no specific users provided, get all workspace members
    if (!targetUsers && data.workspace_id) {
      targetUsers = await getWorkspaceMembers(data.workspace_id);
    }
    
    if (!targetUsers || targetUsers.length === 0) {
      console.warn('No target users found for notification');
      return false;
    }
    
    // Create notifications for each user
    const notifications: Array<[string, number, string | null, string, string, string, string, number | null]> = [];
    
    for (const userId of targetUsers) {
      // Skip creating notification for the user who triggered the action
      if (data.created_by && userId === data.created_by) {
        continue;
      }
      
      const notificationId = generateUUID();
      // Fix: Explicit type conversion for metadata
      const metadataString = data.metadata ? JSON.stringify(data.metadata) : '{}';
      
      notifications.push([
        notificationId,
        userId,
        data.workspace_id || null,
        data.type,
        data.title,
        data.message,
        metadataString,
        data.created_by || null
      ]);
    }
    
    if (notifications.length === 0) {
      return true; // No notifications to create (only creator was in the list)
    }
    
    // Batch insert notifications
    const placeholders = notifications.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    const flatValues = notifications.flat();
    
    await db.execute(
      `INSERT INTO notifications (id, user_id, workspace_id, type, title, message, metadata, created_by) 
       VALUES ${placeholders}`,
      flatValues
    );
    
    // Send email notifications asynchronously
    setTimeout(() => {
      sendEmailNotifications(notifications.map(n => n[0]));
    }, 100);
    
    console.log(`Created ${notifications.length} notifications for ${data.type}`);
    return true;
    
  } catch (error) {
    console.error('Failed to create notification:', error);
    return false;
  }
}

// Send email notifications for given notification IDs
async function sendEmailNotifications(notificationIds: string[]): Promise<void> {
  if (notificationIds.length === 0) return;
  
  const db = await getConnection();
  
  try {
    // Get notifications with user data
    const placeholders = notificationIds.map(() => '?').join(',');
    const [notifications] = await db.execute<RowDataPacket[]>(
      `SELECT n.*, u.name as user_name, u.email as user_email 
       FROM notifications n 
       JOIN users u ON n.user_id = u.id 
       WHERE n.id IN (${placeholders}) AND n.is_email_sent = FALSE`,
      notificationIds
    );
    
    for (const notification of notifications) {
      const preferences = await getUserNotificationPreferences(notification.user_id);
      
      if (!preferences?.email_notifications) {
        continue; // User has email notifications disabled
      }
      
      // Check specific preferences based on notification type
      const shouldSendEmail = checkNotificationTypePreference(notification.type, preferences);
      if (!shouldSendEmail) {
        continue;
      }
      
      // Fix: Safe JSON parsing with error handling
      let metadata: Record<string, any> = {};
      try {
        metadata = notification.metadata ? JSON.parse(notification.metadata as string) : {};
      } catch (parseError) {
        console.error('Failed to parse notification metadata:', parseError);
        metadata = {};
      }
      
      const emailSent = await sendNotificationEmail(
        notification.user_email,
        notification.user_name,
        notification.title,
        notification.message,
        notification.type,
        metadata
      );
      
      // Mark as email sent (regardless of success to avoid spam)
      await db.execute(
        'UPDATE notifications SET is_email_sent = TRUE WHERE id = ?',
        [notification.id]
      );
      
      if (emailSent) {
        console.log(`Email notification sent to ${notification.user_email} for ${notification.type}`);
      }
    }
    
  } catch (error) {
    console.error('Failed to send email notifications:', error);
  }
}

// Check if user wants email for this notification type
function checkNotificationTypePreference(type: NotificationType, preferences: NotificationPreferences): boolean {
  switch (type) {
    case 'workspace_created':
    case 'workspace_updated':
    case 'workspace_deleted':
      return preferences.workspace_changes;
    
    case 'page_created':
    case 'page_updated':
    case 'page_deleted':
    case 'section_created':
    case 'section_updated':
    case 'section_deleted':
      return preferences.page_changes;
    
    case 'comment_added':
      return preferences.comments;
    
    case 'assignment_changed':
      return preferences.assignments;
    
    case 'member_added':
    case 'member_removed':
      return preferences.workspace_changes;
    
    default:
      return true;
  }
}

// Get notifications for a user
export async function getUserNotifications(
  userId: number, 
  limit: number = 20, 
  offset: number = 0,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  const db = await getConnection();
  
  try {
    const whereClause = unreadOnly ? 'WHERE user_id = ? AND is_read = FALSE' : 'WHERE user_id = ?';
    
    const [rows] = await db.execute<(Notification & RowDataPacket)[]>(
      `SELECT * FROM notifications 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      unreadOnly ? [userId, limit, offset] : [userId, limit, offset]
    );
    
    return rows.map(row => {
      // Fix: Safe JSON parsing with proper type handling
      let metadata: Record<string, any> = {};
      try {
        if (row.metadata && typeof row.metadata === 'string') {
          metadata = JSON.parse(row.metadata);
        } else if (row.metadata && typeof row.metadata === 'object') {
          metadata = row.metadata as Record<string, any>;
        }
      } catch (parseError) {
        console.error('Failed to parse notification metadata:', parseError);
        metadata = {};
      }
      
      return {
        ...row,
        metadata
      };
    });
    
  } catch (error) {
    console.error('Failed to get user notifications:', error);
    return [];
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string, userId: number): Promise<boolean> {
  const db = await getConnection();
  
  try {
    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return false;
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: number): Promise<boolean> {
  const db = await getConnection();
  
  try {
    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return false;
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getConnection();
  
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    
    return rows[0]?.count || 0;
  } catch (error) {
    console.error('Failed to get unread notification count:', error);
    return 0;
  }
}

// Delete old notifications (cleanup job)
export async function cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
  const db = await getConnection();
  
  try {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [daysToKeep]
    );
    
    console.log(`Cleaned up ${result.affectedRows} old notifications`);
  } catch (error) {
    console.error('Failed to cleanup old notifications:', error);
  }
}

// Helper functions for common notification scenarios
export const NotificationHelpers = {
  // Workspace notifications
  async notifyWorkspaceCreated(workspaceId: string, workspaceName: string, createdBy: number) {
    return createNotification({
      type: 'workspace_created',
      title: 'New Workspace Created',
      message: `Workspace "${workspaceName}" has been created`,
      workspace_id: workspaceId,
      created_by: createdBy,
      metadata: { workspaceName }
    });
  },

  async notifyWorkspaceUpdated(workspaceId: string, workspaceName: string, changes: Record<string, any>, updatedBy: number) {
    const changesList = Object.keys(changes).join(', ');
    return createNotification({
      type: 'workspace_updated',
      title: 'Workspace Updated',
      message: `Workspace "${workspaceName}" has been updated. Changes: ${changesList}`,
      workspace_id: workspaceId,
      created_by: updatedBy,
      metadata: { workspaceName, changes }
    });
  },

  async notifyWorkspaceDeleted(workspaceName: string, deletedBy: number, memberEmails: string[]) {
    // Get user IDs from emails since workspace is deleted
    if (memberEmails.length === 0) {
      console.warn('No member emails provided for workspace deletion notification');
      return false;
    }
    
    try {
      const db = await getConnection();
      const placeholders = memberEmails.map(() => '?').join(',');
      const [userRows] = await db.execute<RowDataPacket[]>(
        `SELECT id FROM users WHERE email IN (${placeholders})`,
        memberEmails
      );
      const userIds = userRows.map(row => row.id);

      if (userIds.length === 0) {
        console.warn('No users found for provided emails in workspace deletion');
        return false;
      }

      return createNotification({
        type: 'workspace_deleted',
        title: 'Workspace Deleted',
        message: `Workspace "${workspaceName}" has been deleted`,
        created_by: deletedBy,
        target_users: userIds,
        metadata: { workspaceName }
      });
    } catch (error) {
      console.error('Failed to notify workspace deletion:', error);
      return false;
    }
  },

  // Page notifications
  async notifyPageCreated(workspaceId: string, pageTitle: string, createdBy: number) {
    return createNotification({
      type: 'page_created',
      title: 'New Page Created',
      message: `Page "${pageTitle}" has been created`,
      workspace_id: workspaceId,
      created_by: createdBy,
      metadata: { pageTitle }
    });
  },

  async notifyPageUpdated(workspaceId: string, pageTitle: string, updatedBy: number) {
    return createNotification({
      type: 'page_updated',
      title: 'Page Updated',
      message: `Page "${pageTitle}" has been updated`,
      workspace_id: workspaceId,
      created_by: updatedBy,
      metadata: { pageTitle }
    });
  }
};