/**
 * Security utilities for input validation and rate limiting
 */

// Input validation functions
export function validateUsername(username: unknown): username is string {
  if (typeof username !== 'string') return false;
  // Username: 3-20 chars, alphanumeric and underscore only, lowercase
  return /^[a-z0-9_]{3,20}$/.test(username);
}

export function validatePassword(password: unknown): password is string {
  if (typeof password !== 'string') return false;
  // Password: 4-100 chars (reasonable limits)
  return password.length >= 4 && password.length <= 100;
}

export function sanitizeString(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  // Remove null bytes and trim
  return input.replace(/\0/g, '').trim().slice(0, maxLength);
}

// Overloaded function signatures
export function safeParseInt(
  value: string | null | undefined,
  defaultValue: number,
  min?: number,
  max?: number
): number;
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

// Rate limiting (simple in-memory implementation)
// For production, consider using Redis or a dedicated service
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  // Clean up expired entries
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

// Clean up old rate limit entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000); // Clean up every minute
}

// Get client IP from request
export function getClientIP(request: Request): string {
  // Try various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback (won't work in serverless, but helps in traditional deployments)
  return 'unknown';
}
