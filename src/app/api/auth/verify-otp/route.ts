// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/auth';
import { setupDatabase } from '@/lib/database';
import type { OTPType } from '@/types';

export interface VerifyOTPRequest {
  email: string;
  otp: string;
  type: OTPType;
}

export interface VerifyOTPResponse {
  message: string;
  valid: boolean;
}

export interface ErrorResponse {
  error: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<VerifyOTPResponse | ErrorResponse>> {
  try {
    // Ensure database is setup
    await setupDatabase();
    
    const body: VerifyOTPRequest = await request.json();
    const { email, otp, type } = body;

    // Validate input
    if (!email || !otp || !type) {
      return NextResponse.json(
        { error: 'Email, OTP, and type are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValidOTP = await verifyOTP(email, otp, type);
    
    return NextResponse.json({
      message: isValidOTP ? 'OTP verified successfully' : 'Invalid or expired OTP',
      valid: isValidOTP
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}