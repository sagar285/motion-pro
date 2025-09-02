// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { 
  getUserNotifications, 
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUserNotificationPreferences,
  updateNotificationPreferences
} from "@/lib/notifications";
import { verifyToken, getUserById } from "@/lib/auth";

// Helper function to get authenticated user with better error handling
async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Try getting user ID from middleware first
    const userIdFromMiddleware = request.headers.get('user-id');
    if (userIdFromMiddleware) {
      const userId = parseInt(userIdFromMiddleware);
      if (!isNaN(userId)) {
        const user = await getUserById(userId);
        if (user) return user;
      }
    }

    // Try getting from auth token cookie
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      console.warn('No auth token found in request');
      return null;
    }

    const decoded = await verifyToken(token);
    if (!decoded || typeof decoded.id !== 'number') {
      console.warn('Invalid or expired token');
      return null;
    }

    return await getUserById(decoded.id);
  } catch (error) {
    console.error('Error in getAuthenticatedUser:', error);
    return null;
  }
}

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      // Return empty notifications instead of 401 for better UX
      return NextResponse.json({
        notifications: [],
        unreadCount: 0,
        total: 0,
        hasMore: false,
        message: "Please log in to view notifications"
      });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    // Get notifications
    const notifications = await getUserNotifications(user.id, limit, offset, unreadOnly);
    
    // Get unread count
    const unreadCount = await getUnreadNotificationCount(user.id);

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length,
      hasMore: notifications.length === limit
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    
    // Return empty notifications on error instead of failing completely
    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
      total: 0,
      hasMore: false,
      error: "Failed to fetch notifications"
    });
  }
}

// PUT /api/notifications - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      const success = await markAllNotificationsAsRead(user.id);
      return NextResponse.json({ 
        success, 
        message: success ? "All notifications marked as read" : "Failed to mark notifications as read" 
      });
    }

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    const success = await markNotificationAsRead(notificationId, user.id);
    return NextResponse.json({ 
      success, 
      message: success ? "Notification marked as read" : "Failed to mark notification as read" 
    });

  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}