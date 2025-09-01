// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/database";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import bcrypt from "bcryptjs";

// GET /api/user/profile
// Returns current user's profile information
export async function GET(request: NextRequest) {
  try {
    const db = await getConnection();
    
    // In a real app, you'd get the user ID from session/JWT token
    // For now, we'll use a mock user ID or get it from headers
    const userId = request.headers.get('x-user-id') || '1'; // Mock user ID
    
    const [userRows] = (await db.execute(
      `SELECT id, name, email, phone, email_verified, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    )) as [RowDataPacket[], any];

    if (userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userRows[0];
    
    // Remove sensitive information
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
// Body: { name?: string, email?: string, phone?: string, currentPassword?: string, newPassword?: string }
export async function PUT(request: NextRequest) {
  try {
    const db = await getConnection();
    const body = await request.json();
    const { name, email, phone, currentPassword, newPassword } = body || {};
    
    // In a real app, you'd get the user ID from session/JWT token
    const userId = request.headers.get('x-user-id') || '1'; // Mock user ID

    // Validate that user exists
    const [userRows] = (await db.execute(
      `SELECT id, email, password FROM users WHERE id = ?`,
      [userId]
    )) as [RowDataPacket[], any];

    if (userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUser = userRows[0];

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (name && String(name).trim()) {
      updates.push('name = ?');
      values.push(String(name).trim());
    }

    if (email && String(email).trim()) {
      // Check if email is already taken by another user
      const [emailCheck] = (await db.execute(
        `SELECT id FROM users WHERE email = ? AND id != ?`,
        [String(email).trim(), userId]
      )) as [RowDataPacket[], any];

      if (emailCheck.length > 0) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }

      updates.push('email = ?');
      updates.push('email_verified = FALSE'); // Reset verification when email changes
      values.push(String(email).trim());
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone ? String(phone).trim() : null);
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to set new password" }, { status: 400 });
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, currentUser.password);
      if (!passwordMatch) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      updates.push('password = ?');
      values.push(hashedNewPassword);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Add updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    // Execute update
    const [result] = (await db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    )) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Fetch updated user data
    const [updatedUserRows] = (await db.execute(
      `SELECT id, name, email, phone, email_verified, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    )) as [RowDataPacket[], any];

    const updatedUser = {
      id: updatedUserRows[0].id,
      name: updatedUserRows[0].name,
      email: updatedUserRows[0].email,
      phone: updatedUserRows[0].phone,
      emailVerified: updatedUserRows[0].email_verified,
      createdAt: updatedUserRows[0].created_at,
      updatedAt: updatedUserRows[0].updated_at,
    };

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
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