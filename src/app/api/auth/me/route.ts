// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';

export interface MeResponse {
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    email_verified: boolean;
  };
}

export interface MeErrorResponse {
  error: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<MeResponse | MeErrorResponse>> {
  try {
    // Method 1: Try to get user ID from middleware headers (most efficient)
    const userIdFromMiddleware = request.headers.get('user-id');
    if (userIdFromMiddleware) {
      const userId = parseInt(userIdFromMiddleware);
      if (!isNaN(userId)) {
        const user = await getUserById(userId);
        if (user) {
          return NextResponse.json({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              phone: user.phone,
              email_verified: user.email_verified
            }
          });
        }
      }
    }

    // Method 2: Fallback to token verification (if middleware didn't run)
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Use the centralized verifyToken function (now using JOSE)
    const decoded = await verifyToken(token);
    
    if (!decoded || typeof decoded.id !== 'number') {
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

    // Fetch fresh user data from database
    const user = await getUserById(decoded.id);
    
    if (!user) {
      // User was deleted after token was issued
      const response = NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
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

    // Return user information from database (fresh data)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        email_verified: user.email_verified
      }
    });

  } catch (error) {
    console.error('Auth verification error:', error);
    
    // Clear invalid token
    const response = NextResponse.json(
      { error: 'Authentication failed' },
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