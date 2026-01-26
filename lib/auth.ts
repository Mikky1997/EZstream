import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { userQueries, sessionQueries, type User } from './db';
import { randomUUID } from 'crypto';

// Session configuration
const SESSION_COOKIE_NAME = 'streamflix_session';
const SESSION_DURATION_DAYS = 365; // 1 year for persistent login
const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'streamflix-default-secret-change-in-production'
);

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create a new session for a user
export async function createSession(userId: number): Promise<string> {
  const sessionId = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);
  
  // Store session in database
  sessionQueries.create.run(sessionId, userId, expiresAt.toISOString());
  
  // Create JWT token
  const token = await new SignJWT({ sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(JWT_SECRET);
  
  return token;
}

// Get current user from session
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const sessionId = payload.sessionId as string;
    
    if (!sessionId) {
      return null;
    }
    
    // Get session from database
    const session = sessionQueries.findById.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      sessionQueries.delete.run(sessionId);
      return null;
    }
    
    // Get user
    const user = userQueries.findById.get(session.user_id);
    return user || null;
  } catch {
    return null;
  }
}

// Set session cookie
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60, // Convert days to seconds
    path: '/',
  });
}

// Clear session cookie
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Delete session from database
export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (token) {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const sessionId = payload.sessionId as string;
      if (sessionId) {
        sessionQueries.delete.run(sessionId);
      }
    }
  } catch {
    // Ignore errors when deleting session
  }
  
  await clearSessionCookie();
}

// Authenticate user with username and password
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const user = userQueries.findByUsername.get(username.toLowerCase());
  
  if (!user) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.password_hash);
  
  if (!isValid) {
    return null;
  }
  
  return user;
}

// Clean up expired sessions (call periodically)
export function cleanupExpiredSessions(): void {
  sessionQueries.deleteExpired.run();
}
