import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout'];

// Session cookie name
const SESSION_COOKIE_NAME = 'mikkystream_session';

// Get JWT secret - must match lib/auth.ts
const getJwtSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error('SESSION_SECRET not configured');
    return null;
  }
  return new TextEncoder().encode(secret);
};

// Validate JWT token (lightweight check - full validation happens in API routes)
async function isValidToken(token: string): Promise<boolean> {
  try {
    const secret = getJwtSecret();
    if (!secret) return false;
    
    const { payload } = await jwtVerify(token, secret);
    // Just check if token is valid and has sessionId
    return !!payload.sessionId;
  } catch {
    // Token is invalid or expired
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if it's a public route (login page and auth endpoints only)
  if (publicRoutes.some(route => pathname === route)) {
    return NextResponse.next();
  }
  
  // Get session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  
  // If no session cookie, redirect to login (for pages) or return 401 (for API)
  if (!sessionCookie?.value) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Validate the JWT token
  const isValid = await isValidToken(sessionCookie.value);
  
  if (!isValid) {
    // Clear the invalid cookie
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Session expired' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
    
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
