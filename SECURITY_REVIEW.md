# Security Code Review - MikkyStream

**Date:** January 27, 2026  
**Reviewer:** Security Audit  
**Status:** ⚠️ Several issues found - recommendations provided

---

## Executive Summary

The codebase demonstrates **good foundational security practices** including SQL injection protection, XSS mitigation, and proper password hashing. However, there are **critical security gaps** that should be addressed, particularly around authentication security, input validation, and security headers.

**Risk Level:** 🟡 Medium-High

---

## ✅ Security Strengths

### 1. **SQL Injection Protection** ✅
- ✅ All database queries use **prepared statements** (`db.prepare()`)
- ✅ Parameters are properly bound (no string concatenation)
- ✅ Using `better-sqlite3` with parameterized queries

**Example:**
```typescript
findByUsername: db.prepare<[string], User>('SELECT * FROM users WHERE username = ?')
```

### 2. **XSS Protection** ✅
- ✅ No `dangerouslySetInnerHTML` found
- ✅ React automatically escapes content
- ✅ No `eval()` or `document.write()` usage

### 3. **Password Security** ✅
- ✅ Passwords hashed with **bcrypt** (10 rounds)
- ✅ Passwords never logged or exposed
- ✅ Proper password verification

### 4. **Session Management** ✅
- ✅ HTTP-only cookies (XSS protection)
- ✅ JWT tokens with expiration
- ✅ Session validation on protected routes
- ✅ Session cleanup for expired sessions

### 5. **Authentication** ✅
- ✅ Proper middleware protection
- ✅ User isolation (user_id checks)
- ✅ Protected API endpoints

### 6. **Security Headers (Partial)** ✅
- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `poweredByHeader: false`

---

## 🔴 Critical Issues

### 1. **No Rate Limiting on Login Endpoint** 🔴 CRITICAL

**Location:** `app/api/auth/login/route.ts`

**Issue:** Login endpoint has no rate limiting, making it vulnerable to brute force attacks.

**Risk:** Attackers can attempt unlimited login attempts to guess passwords.

**Recommendation:**
```typescript
// Add rate limiting middleware or use a library like 'next-rate-limit'
// Example implementation needed
```

**Priority:** 🔴 HIGH - Implement immediately

---

### 2. **Missing Input Validation** 🔴 HIGH

**Location:** Multiple API endpoints

**Issues:**
- Username/password length not validated
- No sanitization of user inputs
- `parseInt()` used without validation (can return `NaN`)
- No type checking on request bodies

**Examples:**
```typescript
// app/api/auth/login/route.ts
const { username, password } = await request.json();
// No validation of length, format, or type

// app/api/user/history/route.ts
const limit = parseInt(searchParams.get('limit') || '20');
// Could be NaN, negative, or extremely large
```

**Recommendation:**
```typescript
// Add input validation
function validateUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 20 && /^[a-z0-9_]+$/.test(username);
}

function validatePassword(password: string): boolean {
  return password.length >= 4 && password.length <= 100;
}

function safeParseInt(value: string | null, defaultValue: number, min: number, max: number): number {
  const parsed = parseInt(value || String(defaultValue), 10);
  if (isNaN(parsed)) return defaultValue;
  return Math.max(min, Math.min(max, parsed));
}
```

**Priority:** 🔴 HIGH

---

### 3. **Long Session Duration** 🟡 MEDIUM

**Location:** `lib/auth.ts:9`

**Issue:** Sessions last **365 days** (1 year), which is excessive.

**Risk:** If a session is compromised, it remains valid for a very long time.

**Recommendation:**
```typescript
// Reduce to 30 days or implement refresh tokens
const SESSION_DURATION_DAYS = 30; // Or use refresh tokens
```

**Priority:** 🟡 MEDIUM

---

### 4. **Missing Content Security Policy (CSP)** 🟡 MEDIUM

**Location:** `next.config.mjs`

**Issue:** No CSP header configured, allowing potential XSS attacks.

**Risk:** Even with React's auto-escaping, CSP provides defense-in-depth.

**Recommendation:**
```javascript
// Add to next.config.mjs headers()
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https://image.tmdb.org data:; connect-src 'self' https://api.themoviedb.org; frame-src 'self' https://vidsrc.me https://vidsrc-embed.ru;"
}
```

**Priority:** 🟡 MEDIUM

---

### 5. **No CSRF Protection** 🟡 MEDIUM

**Issue:** No CSRF tokens for state-changing operations.

**Risk:** Cross-site request forgery attacks possible.

**Recommendation:**
- Use SameSite cookie attribute (already using 'lax' ✅)
- Consider adding CSRF tokens for sensitive operations
- Verify Origin/Referer headers for API requests

**Priority:** 🟡 MEDIUM (partially mitigated by SameSite cookie)

---

### 6. **Missing Security Headers** 🟡 MEDIUM

**Missing Headers:**
- `Strict-Transport-Security` (HSTS) - Force HTTPS
- `Referrer-Policy` - Control referrer information
- `Permissions-Policy` - Restrict browser features

**Recommendation:**
```javascript
// Add to next.config.mjs
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains; preload'
},
{
  key: 'Referrer-Policy',
  value: 'strict-origin-when-cross-origin'
},
{
  key: 'Permissions-Policy',
  value: 'camera=(), microphone=(), geolocation=()'
}
```

**Priority:** 🟡 MEDIUM

---

### 7. **Error Information Leakage** 🟡 MEDIUM

**Location:** Multiple API routes

**Issue:** Error messages may leak sensitive information.

**Examples:**
```typescript
// Too generic - good
return NextResponse.json({ error: 'Login failed' }, { status: 500 });

// But console.error might log sensitive data
console.error('Login error:', error); // Could log passwords, tokens, etc.
```

**Recommendation:**
- Sanitize error messages before logging
- Don't log request bodies containing passwords
- Use structured logging with redaction

**Priority:** 🟡 MEDIUM

---

### 8. **No Request Size Limits** 🟡 MEDIUM

**Issue:** No limits on request body size, allowing potential DoS attacks.

**Recommendation:**
```typescript
// Add body size validation
const MAX_BODY_SIZE = 1024 * 1024; // 1MB
if (request.headers.get('content-length') && 
    parseInt(request.headers.get('content-length')!) > MAX_BODY_SIZE) {
  return NextResponse.json({ error: 'Request too large' }, { status: 413 });
}
```

**Priority:** 🟡 MEDIUM

---

### 9. **Integer Parsing Without Validation** 🟡 MEDIUM

**Location:** Multiple API routes

**Issue:** `parseInt()` can return `NaN` or handle edge cases poorly.

**Examples:**
```typescript
const limit = parseInt(searchParams.get('limit') || '20');
// Could be NaN, negative, or extremely large
historyQueries.getForUser.all(user.id, user.id, Math.min(limit, 100));
```

**Recommendation:**
```typescript
function safeParseInt(value: string | null, defaultValue: number, min: number, max: number): number {
  const parsed = parseInt(value || String(defaultValue), 10);
  if (isNaN(parsed) || parsed < min) return defaultValue;
  return Math.min(max, parsed);
}

// Usage:
const limit = safeParseInt(searchParams.get('limit'), 20, 1, 100);
```

**Priority:** 🟡 MEDIUM

---

### 10. **No Security Logging/Auditing** 🟢 LOW

**Issue:** No logging of security events (failed logins, suspicious activity).

**Recommendation:**
- Log failed login attempts with IP address
- Log account changes
- Monitor for suspicious patterns
- Consider using a logging service

**Priority:** 🟢 LOW (but recommended for production)

---

## 🟡 Medium Priority Issues

### 11. **Cookie Security in Development** 🟡

**Location:** `lib/auth.ts:93`

**Issue:** Secure flag only set when `FORCE_SECURE_COOKIES=true`, but should be automatic in production.

**Recommendation:**
```typescript
const isSecure = process.env.NODE_ENV === 'production' || process.env.FORCE_SECURE_COOKIES === 'true';
```

**Priority:** 🟡 MEDIUM

---

### 12. **No Password Policy** 🟡

**Issue:** No minimum password requirements enforced.

**Recommendation:**
- Enforce minimum password length (currently just checks existence)
- Consider password complexity requirements
- Add password strength indicator

**Priority:** 🟡 MEDIUM

---

## 🟢 Low Priority / Recommendations

### 13. **Dependency Security**
- ✅ Dependencies appear up-to-date
- ⚠️ Regularly run `npm audit` to check for vulnerabilities
- Consider using Dependabot or similar

### 14. **Environment Variables**
- ✅ `.env` files properly gitignored
- ✅ No secrets in code
- ✅ Example file provided

### 15. **Database Security**
- ✅ Prepared statements used
- ⚠️ Consider database encryption at rest
- ⚠️ Regular backups (not in code, but important)

---

## 📋 Action Items (Priority Order)

### Immediate (Critical)
1. ✅ **Add rate limiting to login endpoint**
2. ✅ **Add input validation for all user inputs**
3. ✅ **Validate and sanitize all `parseInt()` calls**

### High Priority
4. ✅ **Reduce session duration** (or implement refresh tokens)
5. ✅ **Add Content Security Policy header**
6. ✅ **Add missing security headers** (HSTS, Referrer-Policy)

### Medium Priority
7. ✅ **Add CSRF protection** (if needed beyond SameSite)
8. ✅ **Sanitize error logging**
9. ✅ **Add request size limits**
10. ✅ **Improve cookie security in production**

### Low Priority
11. ✅ **Add security event logging**
12. ✅ **Implement password policy**
13. ✅ **Regular dependency audits**

---

## 🔒 Security Checklist

- [x] SQL Injection protection (prepared statements)
- [x] XSS protection (React escaping)
- [x] Password hashing (bcrypt)
- [x] HTTP-only cookies
- [x] Session expiration
- [ ] Rate limiting
- [ ] Input validation
- [ ] CSP header
- [ ] HSTS header
- [ ] CSRF protection
- [ ] Security logging
- [ ] Request size limits

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## Notes

- The codebase shows good security awareness
- Most issues are "defense in depth" improvements
- Critical issues (rate limiting, input validation) should be addressed first
- Consider implementing a security testing pipeline

---

**Review Status:** Complete  
**Next Steps:** Implement critical fixes, then proceed with high/medium priority items.
