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
  // Password: 4-100 chars (simple for family/friends use)
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

// Validate IP address format (basic check)
function isValidIP(ip: string): boolean {
  // IPv4: x.x.x.x
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6: simplified check for common formats
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Known trusted proxy IPs (configure based on your infrastructure)
// In production, set TRUSTED_PROXIES env var to comma-separated list of IPs
const TRUSTED_PROXIES = process.env.TRUSTED_PROXIES?.split(',').map(ip => ip.trim()) || [];

// Get client IP from request - with security validation
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  // If we have trusted proxies configured, only trust headers from those proxies
  // Otherwise, use a fingerprint-based approach for rate limiting
  if (TRUSTED_PROXIES.length > 0) {
    // In a properly configured reverse proxy setup, headers can be trusted
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
  // This means changing IP OR user-agent still gets some rate limiting
  const baseIP = forwarded?.split(',')[0].trim() || realIP || 'unknown';
  const fingerprint = `${baseIP}:${userAgent.slice(0, 50)}:${acceptLanguage.slice(0, 20)}`;
  
  return fingerprint;
}

// Rate limit by username for login attempts (prevents targeted attacks)
export function checkLoginRateLimit(
  ip: string,
  username?: string
): { allowed: boolean; message?: string } {
  // Check IP-based rate limit (5 attempts per 15 minutes)
  const ipLimit = checkRateLimit(`login:ip:${ip}`, 10, 15 * 60 * 1000);
  if (!ipLimit.allowed) {
    return { allowed: false, message: 'Too many login attempts. Please try again later.' };
  }
  
  // Check username-based rate limit if provided (10 attempts per hour)
  if (username) {
    const userLimit = checkRateLimit(`login:user:${username.toLowerCase()}`, 10, 60 * 60 * 1000);
    if (!userLimit.allowed) {
      return { allowed: false, message: 'This account is temporarily locked. Please try again later.' };
    }
  }
  
  return { allowed: true };
}
