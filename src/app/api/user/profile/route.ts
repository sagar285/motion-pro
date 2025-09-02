// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/database";
import { verifyToken, getUserById, updateUser } from "@/lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import bcrypt from "bcryptjs";

// Helper function to get authenticated user from request
async function getAuthenticatedUser(request: NextRequest) {
  // Method 1: Get from middleware headers (your middleware sets this)
  const userIdFromMiddleware = request.headers.get('user-id');
  if (userIdFromMiddleware) {
    const userId = parseInt(userIdFromMiddleware);
    if (!isNaN(userId)) {
      return await getUserById(userId);
    }
  }

  // Method 2: Fallback to JWT token verification (if middleware didn't run)
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  const secret = new TextEncoder().encode("Aman1234");
  
  try {
    const { jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(token, secret);
    
    if (payload?.id && typeof payload.id === 'number') {
      return await getUserById(payload.id as number);
    }
  } catch (error) {
    console.error('JWT verification failed:', error);
  }

  return null;
}

// GET /api/user/profile
// Returns current user's profile information
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return user profile without sensitive data
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return NextResponse.json(safeUser, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile
// Updates user profile information
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, currentPassword, newPassword } = body || {};

    const db = await getConnection();

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    // Validate and add name
    if (name !== undefined && String(name).trim()) {
      updates.push('name = ?');
      values.push(String(name).trim());
    }

    // Validate and add email
    if (email !== undefined && String(email).trim()) {
      // Check if email is already taken by another user
      const [emailCheck] = (await db.execute(
        `SELECT id FROM users WHERE email = ? AND id != ?`,
        [String(email).trim(), user.id]
      )) as [RowDataPacket[], any];

      if (emailCheck.length > 0) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }

      updates.push('email = ?');
      // Reset email verification when email changes
      updates.push('email_verified = FALSE');
      values.push(String(email).trim());
    }

    // Handle phone (can be null)
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone ? String(phone).trim() : null);
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ 
          error: "Current password is required to set new password" 
        }, { status: 400 });
      }

      // Verify current password
      if (!user.password) {
        return NextResponse.json({ 
          error: "Unable to verify current password" 
        }, { status: 400 });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        return NextResponse.json({ 
          error: "Current password is incorrect" 
        }, { status: 400 });
      }

      // Validate new password
      if (newPassword.length < 6) {
        return NextResponse.json({ 
          error: "New password must be at least 6 characters long" 
        }, { status: 400 });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      updates.push('password = ?');
      updates.push('reset_token = NULL');
      updates.push('reset_token_expires = NULL');
      values.push(hashedNewPassword);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Add updated_at and user ID
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(user.id);

    // Execute update
    const [result] = (await db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    )) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Fetch updated user data
    const updatedUser = await getUserById(user.id);
    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to fetch updated user" }, { status: 500 });
    }

    const updatedUserResponse = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      emailVerified: updatedUser.email_verified,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
    };

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUserResponse,
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    return NextResponse.json(
      {
        error: "Failed to update profile",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}