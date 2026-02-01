/**
 * Authentication and session management module
 *
 * Provides secure user authentication using:
 * - bcrypt for password hashing (OWASP-compliant cost factor)
 * - JWT tokens for stateless session validation
 * - Database-backed session storage for revocation support
 * - Secure HTTP-only cookies
 *
 * @module auth
 */

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { userQueries, sessionQueries, type User } from './db';
import { randomUUID } from 'crypto';
import { SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from './constants';

// ============================================================================
// Configuration
// ============================================================================

/**
 * JWT secret from environment.
 * Must be set in .env file for the application to function.
 */
const SESSION_SECRET = process.env.SESSION_SECRET;

/**
 * Lazily initialized JWT secret as Uint8Array.
 * Allows build to succeed without env vars while failing at runtime if missing.
 * @internal
 */
let _jwtSecret: Uint8Array | null = null;

/**
 * Gets the JWT secret, throwing a helpful error if not configured.
 *
 * @throws Error if SESSION_SECRET environment variable is not set
 * @returns JWT secret as Uint8Array for jose library
 * @internal
 */
function getJwtSecret(): Uint8Array {
  if (!SESSION_SECRET) {
    throw new Error(
      'SESSION_SECRET environment variable is required. ' +
      'Set it in your .env file. Generate with: openssl rand -base64 32'
    );
  }
  if (!_jwtSecret) {
    _jwtSecret = new TextEncoder().encode(SESSION_SECRET);
  }
  return _jwtSecret;
}

// ============================================================================
// Password Hashing
// ============================================================================

/** bcrypt cost factor - 12 per OWASP recommendations (2024+) */
const BCRYPT_COST_FACTOR = 12;

/**
 * Hashes a password using bcrypt with OWASP-recommended cost factor.
 *
 * The cost factor of 12 provides a good balance between security and
 * performance, taking approximately 250ms on modern hardware.
 *
 * @param password - Plain text password to hash
 * @returns Promise resolving to the bcrypt hash string
 *
 * @example
 * const hash = await hashPassword(userInput);
 * await db.createUser({ username, passwordHash: hash });
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

/**
 * Verifies a password against a bcrypt hash.
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param password - Plain text password to verify
 * @param hash - bcrypt hash to compare against
 * @returns Promise resolving to true if password matches
 *
 * @example
 * const isValid = await verifyPassword(userInput, user.passwordHash);
 * if (!isValid) {
 *   return { error: 'Invalid credentials' };
 * }
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Creates a new session for an authenticated user.
 *
 * Process:
 * 1. Generates a cryptographically random session ID
 * 2. Stores session in database with expiration date
 * 3. Creates a signed JWT containing the session ID
 *
 * The JWT + database approach allows:
 * - Stateless validation (JWT signature check)
 * - Session revocation (database lookup)
 * - Session listing for user account management
 *
 * @param userId - Database ID of the authenticated user
 * @returns Promise resolving to the signed JWT token string
 *
 * @example
 * const user = await authenticateUser(username, password);
 * if (user) {
 *   const token = await createSession(user.id);
 *   await setSessionCookie(token);
 * }
 */
export async function createSession(userId: number): Promise<string> {
  const sessionId = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  // Store session in database for revocation support
  sessionQueries.create.run(sessionId, userId, expiresAt.toISOString());

  // Create JWT token with session reference
  const token = await new SignJWT({ sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(getJwtSecret());

  return token;
}

/**
 * Retrieves the currently authenticated user from the session cookie.
 *
 * Validation steps:
 * 1. Extract JWT from cookie
 * 2. Verify JWT signature
 * 3. Lookup session in database
 * 4. Check session expiration
 * 5. Fetch and return user record
 *
 * Returns null for any validation failure (expired, invalid, missing).
 *
 * @returns Promise resolving to User object or null if not authenticated
 *
 * @example
 * const user = await getCurrentUser();
 * if (!user) {
 *   redirect('/login');
 * }
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    // Verify JWT signature and extract payload
    const { payload } = await jwtVerify(token, getJwtSecret());
    const sessionId = payload.sessionId as string;

    if (!sessionId) {
      return null;
    }

    // Validate session exists in database
    const session = sessionQueries.findById.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session has expired
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      sessionQueries.delete.run(sessionId);
      return null;
    }

    // Fetch and return user
    const user = userQueries.findById.get(session.user_id);
    return user || null;
  } catch {
    // JWT verification failed or other error - treat as unauthenticated
    return null;
  }
}

// ============================================================================
// Cookie Management
// ============================================================================

/**
 * Sets the session cookie with secure flags.
 *
 * Cookie security settings:
 * - httpOnly: Prevents JavaScript access (XSS protection)
 * - secure: HTTPS only in production (configurable via env)
 * - sameSite: 'lax' prevents CSRF while allowing normal navigation
 * - path: '/' makes cookie available site-wide
 *
 * @param token - JWT token string to store in cookie
 *
 * @example
 * const token = await createSession(user.id);
 * await setSessionCookie(token);
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  // Secure flag: true in production or when explicitly enabled for testing
  const isSecure = process.env.NODE_ENV === 'production' || process.env.FORCE_SECURE_COOKIES === 'true';

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60, // Convert days to seconds
    path: '/',
  });
}

/**
 * Clears the session cookie.
 *
 * @example
 * await clearSessionCookie();
 * redirect('/login');
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Deletes the current session from database and clears the cookie.
 *
 * This performs a full logout:
 * 1. Extracts session ID from cookie
 * 2. Removes session from database (prevents reuse)
 * 3. Clears the cookie
 *
 * Safe to call even if no session exists.
 *
 * @example
 * await deleteSession();
 * redirect('/login');
 */
export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const { payload } = await jwtVerify(token, getJwtSecret());
      const sessionId = payload.sessionId as string;
      if (sessionId) {
        sessionQueries.delete.run(sessionId);
      }
    }
  } catch {
    // Ignore errors - session may already be invalid
    // We still want to clear the cookie
  }

  await clearSessionCookie();
}

// ============================================================================
// User Authentication
// ============================================================================

/**
 * Authenticates a user with username and password.
 *
 * Security notes:
 * - Username is case-insensitive (lowercased before lookup)
 * - Returns null for both "user not found" and "wrong password"
 *   to prevent username enumeration
 * - Uses constant-time password comparison via bcrypt
 *
 * @param username - Username to authenticate
 * @param password - Password to verify
 * @returns Promise resolving to User object if valid, null otherwise
 *
 * @example
 * const user = await authenticateUser(username, password);
 * if (!user) {
 *   return { error: 'Invalid username or password' };
 * }
 * const token = await createSession(user.id);
 */
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

// ============================================================================
// Session Cleanup
// ============================================================================

/**
 * Removes all expired sessions from the database.
 *
 * Call this periodically (e.g., via cron job or scheduled task)
 * to prevent database bloat from accumulated expired sessions.
 *
 * @example
 * // In a scheduled job or API endpoint
 * cleanupExpiredSessions();
 */
export function cleanupExpiredSessions(): void {
  sessionQueries.deleteExpired.run();
}
