import { NextResponse } from 'next/server';
import { authenticateUser, createSession, setSessionCookie } from '@/lib/auth';
import { validateUsername, validatePassword, checkLoginRateLimit, getClientIP } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    // Input validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    if (!validateUsername(username)) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      );
    }
    
    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: 'Invalid password format' },
        { status: 400 }
      );
    }
    
    // Rate limiting: IP-based (10/15min) + username-based (10/hour) for targeted attack prevention
    const clientIP = getClientIP(request);
    const rateLimit = checkLoginRateLimit(clientIP, username);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message || 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }
    
    // Authenticate user
    const user = await authenticateUser(username, password);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Create session
    const token = await createSession(user.id);
    
    // Set cookie
    await setSessionCookie(token);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
      },
    });
  } catch (error) {
    // Don't log sensitive information
    console.error('Login error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
