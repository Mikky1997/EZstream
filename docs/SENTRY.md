# Using Sentry in MikkyStream

Sentry is wired for **errors**, **performance**, and **session replay**. This doc shows how to turn it on and use it.

---

## 1. Turn Sentry on (production)

Set these in your server env (e.g. `.env.local` or your host’s env):

```bash
# Required for events to be sent
SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx

# Optional: link errors to releases (recommended)
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

- **SENTRY_DSN** – used by server and instrumentation.
- **NEXT_PUBLIC_SENTRY_DSN** – used by the browser (client errors, replay).
- **SENTRY_ORG** / **SENTRY_PROJECT** – used at build time to upload source maps so stack traces are readable.

Get the DSN from: [Sentry](https://sentry.io) → your project → **Settings → Client Keys (DSN)**.

---

## 2. What gets sent automatically

- **Unhandled errors** – client and server, including React render errors (via `global-error.tsx`).
- **Performance (traces)** – requests and operations (`tracesSampleRate: 1` in config).
- **Session Replay** – 10% of sessions, 100% when an error occurs (see `sentry.client.config.ts`).

No extra code needed for these; they’re already configured.

---

## 3. Sending errors yourself

When you catch an error and want it in Sentry:

```ts
import * as Sentry from "@sentry/nextjs";

try {
  await somethingRisky();
} catch (error) {
  Sentry.captureException(error);
  throw error; // or show UI, etc.
}
```

Add context so you can filter in Sentry:

```ts
Sentry.withScope((scope) => {
  scope.setTag("feature", "watchlist");
  scope.setExtra("userId", user.id);
  Sentry.captureException(error);
});
```

---

## 4. Checking it in Sentry

1. **Issues** – list of errors; click one for stack trace, breadcrumbs, and replay (if enabled).
2. **Performance** – slow transactions and endpoints.
3. **Replay** – watch the session that led to an error.

Trigger a test error (e.g. a button that throws) and you should see it under **Issues** within a few seconds.

---

## 5. Optional: releases and source maps

If **SENTRY_ORG** and **SENTRY_PROJECT** are set at build time, the build uploads source maps to Sentry and then deletes them (`deleteSourcemapsAfterUpload: true`). That gives you:

- Minified stack traces resolved to real file names and lines.
- Errors tied to a **release** so you know which deploy introduced a bug.

In Sentry: **Releases** shows each deploy; **Issues** can be filtered by release.

---

## 6. Files involved

| File | Role |
|------|------|
| `instrumentation.ts` | Sentry init for server + edge (replaces old sentry.server/edge.config). |
| `sentry.client.config.ts` | Browser init, replay, sample rates. |
| `app/global-error.tsx` | Catches React render errors and sends them to Sentry. |
| `next.config.mjs` | Sentry plugin: source maps, tunnel route, etc. |

No `sentry.server.config.ts` or `sentry.edge.config.ts` anymore; init lives in `instrumentation.ts`.
