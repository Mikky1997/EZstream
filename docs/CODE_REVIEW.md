# Code Review – Full Pass

**Date:** 2025-02  
**Scope:** Security, error handling, performance, accessibility, code quality, API/DB.

---

## Summary

- **Security:** Solid. Input validation, rate limiting, prepared statements, no XSS vectors.
- **Error handling:** Consistent; no empty catch blocks. `console.error` in catch is acceptable (prod keeps error/warn per next.config).
- **No** `eslint-disable`, `@ts-ignore`, or `any` type abuse.
- **One fix applied:** Deprecated `.substr()` in ToastContext replaced with `.slice()`.

---

## 1. Security

| Check                | Status | Notes                                                                                        |
| -------------------- | ------ | -------------------------------------------------------------------------------------------- |
| **Auth**             | OK     | Login validates username/password; rate limiting (IP + username). Session via JWT in cookie. |
| **Middleware**       | OK     | Only `/login`, `/api/auth/login`, `/api/auth/logout` public; rest require valid session.     |
| **Input validation** | OK     | `validateUsername`, `validatePassword`, `sanitizeString`, `safeParseInt` used in API routes. |
| **SQL**              | OK     | All DB access via prepared statements (`?` placeholders); no string concatenation.           |
| **XSS**              | OK     | Single `dangerouslySetInnerHTML` in layout: static theme script (no user input).             |
| **Secrets**          | OK     | No `NEXT_PUBLIC_*` for secrets; SESSION_SECRET, TMDB_API_KEY, etc. server-only.              |
| **Headers**          | OK     | next.config sets X-Frame-Options, CSP, HSTS (prod), etc.                                     |

---

## 2. API Routes

| Route                              | Auth        | Validation                                          | Notes                                        |
| ---------------------------------- | ----------- | --------------------------------------------------- | -------------------------------------------- |
| `/api/auth/login`                  | N/A         | username, password                                  | Rate limited, no sensitive data in response. |
| `/api/auth/logout`, `/api/auth/me` | Cookie      | N/A                                                 | Standard.                                    |
| `/api/user/watchlist`              | requireAuth | mediaType, mediaId, title sanitized                 | GET/POST/DELETE validated.                   |
| `/api/user/history`                | requireAuth | mediaType, mediaId, season, episode, sanitizeString | Bounds and types checked.                    |
| `/api/user/episodes`               | requireAuth | mediaId, season, episode                            | Validated.                                   |
| `/api/search`                      | Middleware  | sanitizeString(q), safeParseInt(page)               | Query length and page bounds.                |
| `/api/browse/*`                    | Middleware  | Via browse-utils (parseBrowseParams)                | Marked `dynamic = 'force-dynamic'`.          |

- Browse routes use `request.url` → already fixed with `export const dynamic = 'force-dynamic'`.
- If the build ever complains about `/api/search` being static, add the same `dynamic` export there.

---

## 3. Database (lib/db.ts)

- Schema with CHECK constraints and indexes.
- All queries use prepared statements; parameters passed separately (no injection).
- WAL mode enabled; data dir created if missing.

---

## 4. Error Handling

- No empty `catch` blocks.
- API routes use `handleError()` or return JSON with status; login does not leak “user exists” vs “bad password”.
- Error boundary logs in dev; user sees generic message (ErrorBoundary).
- `console.error` in catch blocks is intentional; next.config keeps `error`/`warn` in production.

---

## 5. React / UI

- List keys: stable IDs used (toast.id, source.source, genre.id, person.id, etc.); index used only where needed (e.g. feed with type+id+index).
- No obvious missing `key` or key-from-index-only in critical lists.
- Accessibility: Toasts have `role="alert"`, `aria-live="polite"`, dismiss has `aria-label`; FilterDropdown has `aria-expanded`, `aria-haspopup`, `role="listbox"`/`role="option"`.

---

## 6. Minor / Optional

- **History GET:** Fetches `limit * 2` then dedupes and slices to `limit` (documented). Could be simplified later with a different query; not a bug.
- **Director names (watch page):** `key={name}` in director split – duplicate keys if same name appears twice; low risk. Option: `key={\`director-${i}-${name}\`}`.
- **Logging:** Consider replacing ad-hoc `console.error` with a small logger (e.g. dev vs prod, levels) later; not required for current scope.

---

## 7. Fix Applied

- **ToastContext.tsx:** `Math.random().toString(36).substr(2, 9)` → `.slice(2, 11)` to avoid deprecated `substr`.

---

## 8. What Was Not Changed

- No removal of `console.error` in catch blocks (kept for diagnostics; stripped only for `log` in prod).
- No change to auth, middleware, or DB layer; only the one deprecation fix and this review doc.

---

**Conclusion:** Codebase is in good shape. No critical or “stupid” issues found; one small deprecation fix applied and documented here.
