# Kimi Rules for EZstream / MikkyStream

> These rules guide AI assistants working on this project. Based on the project's Cursor rules with Kimi-specific additions.

---

## 1. Shell Commands (PowerShell)

**CRITICAL:** This project uses PowerShell on Windows. **Never use bash syntax:**

```powershell
# ❌ BAD - && is not valid in PowerShell
git add -A && git commit -m "message"

# ✅ GOOD - Run commands separately
git add -A
git commit -m "message"
```

---

## 2. Video Embed Rules (CRITICAL)

### No Sandbox Attribute
**Never use `sandbox` on video iframes** - it breaks playback:

```tsx
// ❌ BAD - Breaks video embeds
<iframe sandbox="allow-scripts allow-same-origin" ... />

// ✅ GOOD - No sandbox for video embeds
<iframe allowFullScreen allow="autoplay; encrypted-media" ... />
```

### Cross-Origin Fullscreen
Cross-origin embeds (vidsrc.me, etc.) REQUIRE wildcards `*` for fullscreen:

```tsx
// ❌ BAD - Fullscreen will NOT work
allow = "accelerometer; autoplay; fullscreen; picture-in-picture";

// ✅ GOOD - Wildcards allow cross-origin iframes
allow = "accelerometer; autoplay *; picture-in-picture *; fullscreen *";
```

### Legacy Attributes
Keep these for Safari/Firefox compatibility:

```tsx
<iframe
  allowFullScreen
  webkitAllowFullScreen={true}
  mozallowfullscreen={true}
  allow="accelerometer; autoplay *; picture-in-picture *; fullscreen *"
/>
```

---

## 3. TypeScript & Type Safety

### Avoid TypeScript ESLint Disables
Server may not have all TypeScript ESLint plugins:

```typescript
// ❌ BAD - Rule may not exist on server
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = (results: any[]) => { ... }

// ✅ GOOD - Use unknown instead
const handler = (results: unknown[]) => {
  setResults(results as MyType[]);
}
```

### Callback Type Compatibility
When passing callbacks to components, use `unknown[]` and cast:

```typescript
// ❌ BAD - TVShow[] not assignable to SearchResult[]
const handleLiveResults = useCallback((results: TVShow[]) => {
  setSearchResults(results);
}, []);

// ✅ GOOD - Use unknown[] and cast inside
const handleLiveResults = useCallback((results: unknown[]) => {
  setSearchResults(results as TVShow[]);
}, []);
```

---

## 4. API Routes (`app/api/**/*.ts`)

### Use Shared Helpers
Import from `lib/api-helpers.ts`:

```typescript
// ❌ BAD - Duplicated auth check
const user = await getCurrentUser();
if (!user) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}

// ✅ GOOD - Use shared helper
import { requireAuth, isAuthError, handleError } from '@/lib/api-helpers';

const authResult = await requireAuth();
if (isAuthError(authResult)) return authResult;
const { user } = authResult;
```

### Media Type Validation

```typescript
// ❌ BAD - Repeated validation
if (mediaType !== 'movie' && mediaType !== 'tv') {
  return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
}

// ✅ GOOD - Use type guard
import { validateMediaType } from '@/lib/api-helpers';

if (!validateMediaType(mediaType)) {
  return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
}
```

### Error Handling

```typescript
// ❌ BAD - Inconsistent error handling
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json({ error: 'Failed' }, { status: 500 });
}

// ✅ GOOD - Use handleError helper
} catch (error) {
  return handleError(error, 'Get watchlist error', 'Failed to get watchlist');
}
```

### No Debug Logging
Remove `console.log` before finalizing:

```typescript
// ❌ BAD - Debug logs left in code
console.log("Request:", { page, genre, sortBy });

// ✅ GOOD - Only log errors (remove debug logs)
```

---

## 5. React Patterns (`**/*.tsx`)

### Context Memoization
Always memoize context values and wrap functions in `useCallback`:

```tsx
// ❌ BAD - Causes re-renders on every state change
const value = { user, loading, login, logout };
return <Context.Provider value={value}>{children}</Context.Provider>;

// ✅ GOOD - Memoized value and callbacks
const login = useCallback(async (username, password) => { ... }, []);
const logout = useCallback(async () => { ... }, [router]);

const contextValue = useMemo(() => ({
  user, loading, login, logout
}), [user, loading, login, logout]);

return <Context.Provider value={contextValue}>{children}</Context.Provider>;
```

### Error Handling with Toast
Show user feedback for async operations:

```tsx
// ❌ BAD - Silent failure
await addToWatchlist(mediaType, mediaId);

// ✅ GOOD - User feedback
try {
  const success = await addToWatchlist(mediaType, mediaId);
  if (success) {
    showToast('Added to watchlist', 'success');
  } else {
    showToast('Failed to add', 'error');
  }
} catch {
  showToast('Failed to add', 'error');
}
```

### Accessibility
Always add aria-labels to interactive elements:

```tsx
// ❌ BAD
<button onClick={toggle}><Icon /></button>
<select onChange={...}>

// ✅ GOOD
<button onClick={toggle} aria-label="Toggle menu"><Icon /></button>
<select id="season" aria-label="Select season">
<label htmlFor="season">Season:</label>
```

---

## 6. Custom Hooks (`app/hooks/*.ts`)

### Extract Reusable Logic

```typescript
// ❌ BAD - Duplicated in Navbar.tsx and SearchBar.tsx
const [query, setQuery] = useState('');
const [results, setResults] = useState([]);
const debounceRef = useRef<NodeJS.Timeout | null>(null);
useEffect(() => { /* debounced search logic */ }, [query]);

// ✅ GOOD - Reusable hook
import { useSearch } from '@/app/hooks/useSearch';
const { query, setQuery, results, isSearching, clear } = useSearch({
  debounceMs: 200,
  maxResults: 8,
});
```

### Hook Structure Template

```typescript
// 1. Options interface
interface UseSearchOptions {
  debounceMs?: number;
  maxResults?: number;
}

// 2. Return interface
interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  isSearching: boolean;
}

// 3. Hook with defaults
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs = 200, maxResults = 8 } = options;
  // ...
}
```

### Cleanup Effects
Always cleanup timeouts, intervals, and subscriptions:

```typescript
// ✅ GOOD - Proper cleanup
useEffect(() => {
  const timer = setTimeout(() => { ... }, debounceMs);
  return () => clearTimeout(timer);
}, [dependency]);
```

### Stable Callbacks
Use `useCallback` for functions returned from hooks:

```typescript
const clear = useCallback(() => {
  setQuery('');
  setResults([]);
}, []);
```

---

## 7. Mobile & Responsive Design

### Touch Detection via CSS
Use CSS media queries for touch detection, NOT JavaScript:

```css
/* ✅ GOOD - Instant detection, no hydration delay */
@media (hover: none), (pointer: coarse) {
  .card-scale:hover {
    transform: none;
  }
  .card-action-btn {
    opacity: 1 !important;
  }
}
```

---

## 8. Code Organization

### DRY Principle
When code appears in 2+ places, extract it:

| Pattern | Extract To |
|---------|-----------|
| Shared constants | `lib/constants/*.ts` |
| API helpers | `lib/api-helpers.ts` |
| React hooks | `app/hooks/*.ts` |
| UI components | `app/components/shared/*.ts` |

### File Size Guidelines

| Threshold | Action |
|-----------|--------|
| > 300 lines | Consider splitting |
| > 500 lines | Must split |
| 3+ useState | Consider custom hook |
| 5+ useEffect | Must refactor |

### Component Composition

```tsx
// ❌ BAD - 400 line page component
export default function BrowseMovies() {
  // 15 useState calls
  // 8 useEffect calls
  // 300 lines of JSX
}

// ✅ GOOD - Composed from smaller pieces
export default function BrowseMovies() {
  return (
    <BrowsePageLayout
      title="Browse Movies"
      mediaType="movie"
      genres={MOVIE_GENRES}
      sortOptions={MOVIE_SORT_OPTIONS}
    />
  );
}
```

### Barrel Exports
Use `index.ts` for cleaner imports:

```typescript
// app/components/browse/index.ts
export { BrowsePageLayout } from './BrowsePageLayout';
export { FilterPills } from './FilterPills';
export { MediaGrid } from './MediaGrid';

// Usage
import { BrowsePageLayout, FilterPills } from '@/app/components/browse';
```

### Type Definitions
Keep types in `types/index.ts` or colocate with component:

```typescript
// Shared types → types/index.ts
export interface Movie { ... }
export type MediaType = 'movie' | 'tv';

// Component-specific types → same file
interface MovieCardProps { ... }
```

---

## 9. Kimi-Specific Guidelines

### Before Making Changes
1. Read relevant existing code to understand patterns
2. Check if similar functionality already exists elsewhere
3. Follow existing naming conventions

### When Writing Code
1. **Make minimal changes** - Don't over-engineer
2. **Follow existing style** - Match the codebase
3. **Add comments** only for complex logic
4. **Use TypeScript strictly** - No `any` types

### Before Finishing
1. Verify no `console.log` debug statements remain
2. Ensure error handling is in place
3. Check accessibility (aria-labels)
4. Confirm mobile responsiveness

### Commit and Push (ALWAYS)
**After EVERY change, commit and push immediately:**
```powershell
git add <files>
git commit -m "<descriptive message>"
git push
```
Do not wait for user to ask - this is automatic after changes are verified.

### Testing Checklist
- [ ] Component renders without errors
- [ ] TypeScript compiles (`npm run build`)
- [ ] No lint errors (`npm run lint`)
- [ ] Responsive on mobile/desktop
- [ ] Accessibility labels present

---

## 10. Deployment Commands

After each push to `main`, run on server (wa7sh):

```powershell
cd /var/www/mikkystream
git pull
npm run build
pm2 restart mikkystream --update-env
```

If dependencies changed, run `npm ci` before `npm run build`.

---

## 11. Project Context

### URLs
- Production: https://mikky.vip/
- Local dev: http://localhost:3000

### Test Credentials
- Username: `mikky`
- Password: `mikky`
- User ID: 22

### API Keys (from .env.local)
- TMDB_API_KEY - Movie/TV metadata
- OMDB_API_KEY - IMDB ratings
- SESSION_SECRET - JWT signing

### Database
- SQLite with better-sqlite3
- Location: `data/mikkystream.db`
- Tables: users, sessions, watch_history, watchlist

---

## Quick Reference

```typescript
// Common imports
import { requireAuth, isAuthError, handleError, validateMediaType } from '@/lib/api-helpers';
import { useSearch } from '@/app/hooks/useSearch';
import { useUserLists } from '@/app/hooks/useUserLists';

// Common patterns
const authResult = await requireAuth();
if (isAuthError(authResult)) return authResult;
const { user } = authResult;

// Error handling
try {
  // async operation
} catch (error) {
  return handleError(error, 'Context message', 'User-friendly message');
}
```

---

**Last Updated:** 2026-01-31  
**Project:** EZstream / MikkyStream
