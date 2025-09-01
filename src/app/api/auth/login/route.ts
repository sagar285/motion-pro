// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import { setupDatabase } from '@/lib/database';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    email_verified: boolean;
  };
  token: string;
}

export interface LoginErrorResponse {
  error: string;
  requiresVerification?: boolean;
  email?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse | LoginErrorResponse>> {
  try {
    // Ensure database is setup
    await setupDatabase();
    
    const body: LoginRequest = await request.json();
    const { email, password, rememberMe } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await authenticateUser(email, password);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.email_verified) {
      return NextResponse.json(
        { 
          error: 'Please verify your email before logging in',
          requiresVerification: true,
          email: user.email
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name
    };
    
    const token = generateToken(tokenPayload);

    // Create response
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        email_verified: user.email_verified
      },
      token
    });

    // Set HTTP-only cookie for token
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 7 days or 1 day
      path: '/'
    };

    response.cookies.set('auth-token', token, cookieOptions);

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}