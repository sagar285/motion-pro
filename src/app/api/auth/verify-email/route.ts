// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP, verifyUserEmail, generateToken, getUserByEmail, generateOTP, storeOTP } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { setupDatabase } from '@/lib/database';

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendEmailRequest {
  email: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ResendEmailResponse {
  message: string;
  emailSent: boolean;
}

export interface ErrorResponse {
  error: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<VerifyEmailResponse | ErrorResponse>> {
  try {
    // Ensure database is setup
    await setupDatabase();
    
    const body: VerifyEmailRequest = await request.json();
    const { email, otp } = body;

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValidOTP = await verifyOTP(email, otp, 'verification');
    
    if (!isValidOTP) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Update user verification status
    await verifyUserEmail(email);

    return NextResponse.json({
      message: 'Email verified successfully! You can now log in.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Resend verification email
export async function PUT(request: NextRequest): Promise<NextResponse<ResendEmailResponse | ErrorResponse>> {
  try {
    await setupDatabase();
    
    const body: ResendEmailRequest = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    if (user.email_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate and store new OTP
    const otp = generateOTP();
    await storeOTP(email, otp, 'verification');
    
    // Send verification email
    const emailSent = await sendVerificationEmail(email, otp, user.name);
    
    return NextResponse.json({
      message: 'Verification email sent successfully',
      emailSent
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}