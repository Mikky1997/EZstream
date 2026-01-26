import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout'];

// Routes that are always accessible (API routes for public data)
const publicApiRoutes = [
  '/api/search',
  '/api/trending',
  '/api/popular',
  '/api/movie',
  '/api/tv',
  '/api/browse',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if it's a public route
  if (publicRoutes.some(route => pathname === route)) {
    return NextResponse.next();
  }
  
  // Check if it's a public API route
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check for session cookie
  const sessionCookie = request.cookies.get('mikkystream_session');
  
  // If no session and trying to access protected route, redirect to login
  if (!sessionCookie && !pathname.startsWith('/api/')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // For API routes without session, return 401
  if (!sessionCookie && pathname.startsWith('/api/user/')) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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
