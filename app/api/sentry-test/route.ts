import * as Sentry from "@sentry/nextjs";

/**
 * Test route: triggers a Sentry error so you can confirm setup.
 * Hit GET /api/sentry-test then check Sentry → Issues.
 * Safe to delete this file after testing.
 */
export async function GET() {
  const testError = new Error("Sentry test – if you see this in Sentry, it works.");
  Sentry.captureException(testError);
  return Response.json(
    { ok: true, message: "Test error sent to Sentry. Check Sentry → Issues." },
    { status: 200 },
  );
}
