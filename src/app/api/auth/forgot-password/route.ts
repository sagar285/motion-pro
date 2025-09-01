// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, generateOTP, storeOTP } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { setupDatabase } from '@/lib/database';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  emailSent: boolean;
}

export interface ErrorResponse {
  error: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ForgotPasswordResponse | ErrorResponse>> {
  try {
    // Ensure database is setup
    await setupDatabase();
    
    const body: ForgotPasswordRequest = await request.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json({
        message: 'If an account with this email exists, we have sent a password reset code.',
        emailSent: false
      });
    }

    // Generate and store OTP for password reset
    const otp = generateOTP();
    await storeOTP(email, otp, 'password_reset');
    
    // Send password reset email
    const emailSent = await sendPasswordResetEmail(email, otp, user.name);
    
    return NextResponse.json({
      message: 'If an account with this email exists, we have sent a password reset code.',
      emailSent
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}