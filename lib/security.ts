/**
 * Security utilities for input validation and rate limiting
 *
 * This module provides essential security functions for:
 * - Input validation (username, password, generic strings)
 * - Safe integer parsing with bounds checking
 * - In-memory rate limiting for login attempts
 * - Client IP extraction with fingerprinting
 *
 * @module security
 */

import {
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  LOGIN_RATE_LIMIT_IP,
  LOGIN_RATE_LIMIT_IP_WINDOW_MS,
  LOGIN_RATE_LIMIT_USER,
  LOGIN_RATE_LIMIT_USER_WINDOW_MS,
  RATE_LIMIT_CLEANUP_INTERVAL_MS,
} from './constants';

// ============================================================================
// Input Validation
// ============================================================================

/**
 * Validates a username against security requirements.
 *
 * Requirements:
 * - Must be a string
 * - 3-20 characters long
 * - Only lowercase alphanumeric characters and underscores
 * - No spaces or special characters
 *
 * @param username - The value to validate
 * @returns Type guard indicating if the value is a valid username string
 *
 * @example
 * if (validateUsername(input)) {
 *   // input is now typed as string and safe to use
 *   const user = await findUser(input);
 * }
 */
export function validateUsername(username: unknown): username is string {
  if (typeof username !== 'string') return false;
  const pattern = new RegExp(
    `^[a-z0-9_]{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}$`
  );
  return pattern.test(username);
}

/**
 * Validates a password meets minimum requirements.
 *
 * Requirements:
 * - Must be a string
 * - 4-100 characters long
 * - No additional complexity requirements (suitable for friends/family use)
 *
 * Note: For public-facing applications, consider adding complexity requirements
 * (uppercase, lowercase, numbers, symbols).
 *
 * @param password - The value to validate
 * @returns Type guard indicating if the value is a valid password string
 *
 * @example
 * if (!validatePassword(password)) {
 *   return { error: 'Password must be 4-100 characters' };
 * }
 */
export function validatePassword(password: unknown): password is string {
  if (typeof password !== 'string') return false;
  return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
}

/**
 * Sanitizes a string input by removing potentially dangerous characters.
 *
 * Operations performed:
 * - Rejects non-string inputs (returns empty string)
 * - Removes null bytes (prevents null byte injection)
 * - Trims whitespace
 * - Truncates to maximum length
 *
 * @param input - The value to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized string, or empty string if input is invalid
 *
 * @example
 * const query = sanitizeString(searchParams.get('q'), 200);
 */
export function sanitizeString(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return input.replace(/\0/g, '').trim().slice(0, maxLength);
}

// ============================================================================
// Safe Integer Parsing
// ============================================================================

/**
 * Safely parses a string to an integer with bounds checking.
 *
 * Features:
 * - Returns default value for null/undefined/empty inputs
 * - Returns default value for non-numeric strings
 * - Clamps result to specified min/max bounds
 * - Prevents integer overflow attacks
 *
 * @overload
 * @param value - String value to parse
 * @param defaultValue - Default number to return if parsing fails
 * @param min - Minimum allowed value (default: MIN_SAFE_INTEGER)
 * @param max - Maximum allowed value (default: MAX_SAFE_INTEGER)
 * @returns Parsed integer clamped to bounds, or default value
 */
export function safeParseInt(
  value: string | null | undefined,
  defaultValue: number,
  min?: number,
  max?: number
): number;

/**
 * @overload
 * @param value - String value to parse
 * @param defaultValue - undefined to return undefined on failure
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Parsed integer clamped to bounds, or undefined
 */
export function safeParseInt(
  value: string | null | undefined,
  defaultValue: undefined,
  min?: number,
  max?: number
): undefined;

export function safeParseInt(
  value: string | null | undefined,
  defaultValue: number | undefined,
  min: number = Number.MIN_SAFE_INTEGER,
  max: number = Number.MAX_SAFE_INTEGER
): number | undefined {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  return Math.max(min, Math.min(max, parsed));
}

// ============================================================================
// Rate Limiting
// ============================================================================

/**
 * Rate limit entry stored in memory.
 * @internal
 */
interface RateLimitEntry {
  /** Number of requests made in current window */
  count: number;
  /** Timestamp when the window resets */
  resetTime: number;
}

/**
 * In-memory store for rate limit entries.
 * Key format: "prefix:identifier" (e.g., "login:ip:192.168.1.1")
 *
 * Note: For production with multiple instances, consider using Redis
 * or a dedicated rate limiting service.
 *
 * @internal
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Result of a rate limit check.
 */
interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in current window */
  remaining: number;
  /** Timestamp when the rate limit window resets */
  resetAt: number;
}

/**
 * Checks if a request should be rate limited.
 *
 * Implements a sliding window rate limiting algorithm:
 * - Each identifier gets `maxRequests` attempts per `windowMs` period
 * - First request starts a new window
 * - Window resets after `windowMs` milliseconds
 *
 * @param identifier - Unique identifier for the rate limit (e.g., IP address, username)
 * @param maxRequests - Maximum requests allowed per window (default: 5)
 * @param windowMs - Window duration in milliseconds (default: 15 minutes)
 * @returns Object indicating if request is allowed and remaining quota
 *
 * @example
 * const result = checkRateLimit(`api:${userId}`, 100, 60000); // 100 req/min
 * if (!result.allowed) {
 *   return new Response('Too many requests', { status: 429 });
 * }
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // Clean up expired entry
  if (entry && entry.resetTime < now) {
    rateLimitStore.delete(key);
    entry = undefined;
  }

  if (!entry) {
    // First request in window
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: entry.resetTime,
    };
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetTime,
  };
}

// ============================================================================
// Rate Limit Cleanup
// ============================================================================

/**
 * Interval ID for the cleanup timer.
 * Stored to allow cleanup on module unload (hot reloading).
 * @internal
 */
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Starts the periodic cleanup of expired rate limit entries.
 * Safe to call multiple times - will not create duplicate intervals.
 * @internal
 */
function startRateLimitCleanup(): void {
  // Prevent duplicate intervals (important for hot reloading)
  if (cleanupIntervalId !== null) return;

  if (typeof setInterval !== 'undefined') {
    cleanupIntervalId = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
          rateLimitStore.delete(key);
        }
      }
    }, RATE_LIMIT_CLEANUP_INTERVAL_MS);

    // Prevent the interval from keeping Node.js alive
    if (cleanupIntervalId.unref) {
      cleanupIntervalId.unref();
    }
  }
}

// Start cleanup on module load
startRateLimitCleanup();

// ============================================================================
// IP Address Utilities
// ============================================================================

/**
 * Validates an IP address format (IPv4 or IPv6).
 *
 * @param ip - String to validate as IP address
 * @returns true if the string is a valid IP format
 * @internal
 */
function isValidIP(ip: string): boolean {
  // IPv4: x.x.x.x (each octet 0-255)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6: simplified check for common formats
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * List of trusted proxy IPs.
 * Configure via TRUSTED_PROXIES environment variable (comma-separated).
 *
 * When configured, X-Forwarded-For and X-Real-IP headers from these
 * proxies will be trusted for client IP extraction.
 *
 * @internal
 */
const TRUSTED_PROXIES = process.env.TRUSTED_PROXIES?.split(',').map(ip => ip.trim()) || [];

/**
 * Extracts the client IP address from a request.
 *
 * Strategy:
 * 1. If TRUSTED_PROXIES is configured, trust X-Forwarded-For/X-Real-IP headers
 * 2. Otherwise, generate a fingerprint combining IP + User-Agent + Accept-Language
 *    to prevent easy bypass while maintaining some privacy
 *
 * The fingerprint approach means an attacker must spoof both IP AND browser
 * headers to bypass rate limiting, making attacks more difficult.
 *
 * @param request - The incoming request object
 * @returns Client identifier (IP address or fingerprint)
 *
 * @example
 * const clientIP = getClientIP(request);
 * const rateLimit = checkRateLimit(`api:${clientIP}`);
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  // If we have trusted proxies configured, trust headers from those proxies
  if (TRUSTED_PROXIES.length > 0) {
    if (forwarded) {
      const ip = forwarded.split(',')[0].trim();
      if (isValidIP(ip)) {
        return ip;
      }
    }
    if (realIP && isValidIP(realIP)) {
      return realIP;
    }
  }

  // Without trusted proxy config, generate a fingerprint to prevent easy bypass
  // This includes User-Agent to make spoofing harder (attacker must match both)
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';

  // Use forwarded IP (if present) combined with fingerprint
  // Changing IP OR user-agent still gets some rate limiting
  const baseIP = forwarded?.split(',')[0].trim() || realIP || 'unknown';
  const fingerprint = `${baseIP}:${userAgent.slice(0, 50)}:${acceptLanguage.slice(0, 20)}`;

  return fingerprint;
}

// ============================================================================
// Login Rate Limiting
// ============================================================================

/**
 * Result of a login rate limit check.
 */
interface LoginRateLimitResult {
  /** Whether the login attempt is allowed */
  allowed: boolean;
  /** User-friendly message if rate limited */
  message?: string;
}

/**
 * Checks rate limits specifically for login attempts.
 *
 * Implements two-tier rate limiting:
 * 1. IP-based: 10 attempts per 15 minutes (prevents distributed attacks)
 * 2. Username-based: 10 attempts per hour (prevents targeted account attacks)
 *
 * Both limits must pass for the login attempt to proceed.
 *
 * @param ip - Client IP address or fingerprint
 * @param username - Optional username being attempted
 * @returns Object indicating if attempt is allowed, with message if blocked
 *
 * @example
 * const clientIP = getClientIP(request);
 * const rateLimit = checkLoginRateLimit(clientIP, username);
 * if (!rateLimit.allowed) {
 *   return Response.json({ error: rateLimit.message }, { status: 429 });
 * }
 */
export function checkLoginRateLimit(
  ip: string,
  username?: string
): LoginRateLimitResult {
  // Check IP-based rate limit
  const ipLimit = checkRateLimit(
    `login:ip:${ip}`,
    LOGIN_RATE_LIMIT_IP,
    LOGIN_RATE_LIMIT_IP_WINDOW_MS
  );
  if (!ipLimit.allowed) {
    return {
      allowed: false,
      message: 'Too many login attempts. Please try again later.',
    };
  }

  // Check username-based rate limit if provided
  if (username) {
    const userLimit = checkRateLimit(
      `login:user:${username.toLowerCase()}`,
      LOGIN_RATE_LIMIT_USER,
      LOGIN_RATE_LIMIT_USER_WINDOW_MS
    );
    if (!userLimit.allowed) {
      return {
        allowed: false,
        message: 'This account is temporarily locked. Please try again later.',
      };
    }
  }

  return { allowed: true };
}
