// File: app/api/user/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
// Import the centralized auth functions from your new lib/auth.ts
import { verifyToken, getUserById, UserResponse } from '@/lib/auth';

// Define the expected response structure for this route.
// It's good practice to use a specific interface for each API response.
export interface MeResponse extends UserResponse {}

export interface ErrorResponse {
  error: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<MeResponse | ErrorResponse>> {
  try {
    // 1. Get the token from the 'auth-token' cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    // 2. Verify the token using the centralized function from lib/auth
    const decodedPayload = verifyToken(token);

    if (!decodedPayload || typeof decodedPayload.id !== 'number') {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 3. Fetch the LATEST user data using the centralized function from lib/auth
    const user = await getUserById(decodedPayload.id);

    if (!user) {
        // This case handles if the user was deleted after the token was issued.
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Sanitize and return the fresh user data from the database
    // This ensures no sensitive data like password hashes are ever sent to the client.
    const userData: MeResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      email_verified: user.email_verified,
    };

    return NextResponse.json(userData);

  } catch (error) {
    console.error('User data fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

