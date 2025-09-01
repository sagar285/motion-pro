// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export interface LogoutResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
}

export async function POST(): Promise<NextResponse<LogoutResponse | ErrorResponse>> {
  try {
    const response = NextResponse.json({
      message: 'Logged out successfully'
    });

    // Clear the auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 0,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}