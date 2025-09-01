// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

interface DecodedToken {
  id: number;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface MeResponse {
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    email_verified?: boolean;
  };
}

export interface MeErrorResponse {
  error: string;
}

// Type guard function for JWT payload validation
function isValidTokenPayload(payload: any): payload is DecodedToken {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.id === 'number' &&
    typeof payload.email === 'string' &&
    typeof payload.name === 'string'
  );
}

export async function GET(request: NextRequest): Promise<NextResponse<MeResponse | MeErrorResponse>> {
  try {
    // Get the token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Prepare JWT secret as Uint8Array (required by JOSE)
    const jwtSecret = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'Aman1234';
    const secretKey = new TextEncoder().encode(jwtSecret);

    // Verify the JWT token using JOSE
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: 'motion-pro',
      audience: 'motion-pro-users'
    });

    // Validate the payload structure
    if (!isValidTokenPayload(payload)) {
      throw new Error('Invalid token payload structure');
    }

    // Return user information (matching your login response structure)
    return NextResponse.json({
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        // Note: phone and email_verified are not in JWT payload,
        // you might want to fetch from database if needed
        email_verified: true // Assuming verified since they're logged in
      }
    });

  } catch (error) {
    console.error('Auth verification error:', error);

    // Clear invalid token
    const response = NextResponse.json(
      { error: 'Invalid authentication token' },
      { status: 401 }
    );

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;
  }
}