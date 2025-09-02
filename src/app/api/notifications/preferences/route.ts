// app/api/notifications/preferences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { 
  getUserNotificationPreferences,
  updateNotificationPreferences
} from "@/lib/notifications";
import { verifyToken, getUserById } from "@/lib/auth";

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const userIdFromMiddleware = request.headers.get('user-id');
  if (userIdFromMiddleware) {
    const userId = parseInt(userIdFromMiddleware);
    if (!isNaN(userId)) {
      return await getUserById(userId);
    }
  }

  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded || typeof decoded.id !== 'number') return null;

  return await getUserById(decoded.id);
}

// GET /api/notifications/preferences - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getUserNotificationPreferences(user.id);
    
    if (!preferences) {
      return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
    }

    return NextResponse.json(preferences);

  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      email_notifications,
      workspace_changes,
      page_changes,
      comments,
      assignments,
      daily_digest
    } = body;

    // Validate input types
    const preferences: any = {};
    if (typeof email_notifications === 'boolean') preferences.email_notifications = email_notifications;
    if (typeof workspace_changes === 'boolean') preferences.workspace_changes = workspace_changes;
    if (typeof page_changes === 'boolean') preferences.page_changes = page_changes;
    if (typeof comments === 'boolean') preferences.comments = comments;
    if (typeof assignments === 'boolean') preferences.assignments = assignments;
    if (typeof daily_digest === 'boolean') preferences.daily_digest = daily_digest;

    if (Object.keys(preferences).length === 0) {
      return NextResponse.json({ error: "No valid preferences provided" }, { status: 400 });
    }

    const success = await updateNotificationPreferences(user.id, preferences);

    return NextResponse.json({ 
      success, 
      message: success ? "Preferences updated successfully" : "Failed to update preferences" 
    });

  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}