// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP, updatePassword, getUserByEmail } from '@/lib/auth';
import { setupDatabase } from '@/lib/database';

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ResetPasswordResponse | ErrorResponse>> {
  try {
    // Ensure database is setup
    await setupDatabase();
    
    const body: ResetPasswordRequest = await request.json();
    const { email, otp, newPassword } = body;

    // Validate input
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValidOTP = await verifyOTP(email, otp, 'password_reset');
    
    if (!isValidOTP) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update password
    await updatePassword(email, newPassword);

    return NextResponse.json({
      message: 'Password reset successfully! You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}