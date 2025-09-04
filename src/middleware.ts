import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "Aman1234");

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    const protectedRoutes = ['/dashboard', '/profile', '/settings'];
    const authRoutes = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password'];

    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    const token = request.cookies.get('auth-token')?.value;

    if (isProtectedRoute && !token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret);
   console.log(payload,"kkkjjjjjjjjjjjjjj")
        if (isAuthRoute) {
          // return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        const requestHeaders = new Headers(request.headers);
        if (payload?.id) requestHeaders.set('user-id', String(payload.id));
        if (payload?.email) requestHeaders.set('user-email', String(payload.email));

        return NextResponse.next({ request: { headers: requestHeaders } });

      } catch (err) {
        console.error("JWT verification failed:", err);

        const response = isProtectedRoute
          ? NextResponse.redirect(new URL('/login', request.url))
          : NextResponse.next();

        response.cookies.set('auth-token', '', { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 0, path: '/' });
        return response;
      }
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Middleware error:", err);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
