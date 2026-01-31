# Code review summary (post–Next 16 / Sentry cleanup)

**Scope:** Changes from Next 14 → 16 upgrade, Sentry setup, proxy migration, and cleanup.

---

## What was reviewed

- **proxy.ts** – Auth logic unchanged; only export name `proxy` and `publicRoutes` (test route removed). No dead code.
- **instrumentation.ts** – Single Sentry init for nodejs + edge. No duplicate config.
- **next.config.mjs** – Sentry options, turbopack, source maps. Comment updated: "middleware" → "proxy".
- **app/global-error.tsx** – Reports to Sentry and shows fallback UI. Correct for Next 16.
- **Route handlers** (movie, tv, person) – Use `params: Promise<{ id: string }>` and `await params`. Correct for Next 16.
- **package.json** – Next 16, React 19, `build: "next build --webpack"`, `lint: "eslint ."`. Matches stack.
- **.npmrc** – `legacy-peer-deps=true` for Sentry + Next 16. Required for install.

---

## Cleanup done

1. **Removed Sentry test route** – `/api/sentry-test` and its entry in `publicRoutes`. Testing: use browser console `throw new Error("Sentry test");` (see docs/SENTRY.md).
2. **Removed TMDB debug log** – `console.log("TMDB request:", ...)` in `lib/tmdb.ts` was firing on every request; removed.
3. **DRY instrumentation** – One `sentryOptions` object, single `Sentry.init()` for both runtimes.
4. **Docs** – DEPLOY.md: Normal Update uses `npm ci` and `--update-env`. SENTRY.md: test instructions use console; removed reference to deleted test route.

---

## Left as-is (intentional)

- **console.log in scripts/** – `seed-users.ts` and `seed-users.example.ts` use console for CLI output; kept.
- **next.config `removeConsole`** – Only strips `log` in production; `error`/`warn` kept; no change.
- **Sentry client config** – Replay and sample rates unchanged; can tune later if needed.

---

## Deploy after pulling this

```bash
cd /var/www/mikkystream
git pull
npm ci
npm run build
pm2 restart mikkystream --update-env
```

After this, `/api/sentry-test` will 404 (route removed). Use the browser-console test above to verify Sentry.
