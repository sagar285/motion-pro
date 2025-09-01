// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createUser, generateOTP, storeOTP } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { setupDatabase } from '@/lib/database';

export interface SignupRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface SignupResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  emailSent: boolean;
}

export interface ErrorResponse {
  error: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SignupResponse | ErrorResponse>> {
  try {
    // Ensure database is setup
    await setupDatabase();
    
    const body: SignupRequest = await request.json();
    const { name, email, phone, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Create user
    try {
      const user = await createUser({ name, email, phone, password });
      
      // Generate and store OTP
      const otp = generateOTP();
      await storeOTP(email, otp, 'verification');
      
      // Send verification email
      const emailSent = await sendVerificationEmail(email, otp, name);
      
      return NextResponse.json({
        message: 'Account created successfully! Please check your email for verification code.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        },
        emailSent
      }, { status: 201 });

    } catch (error: any) {
      if (error.message === 'User already exists') {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}