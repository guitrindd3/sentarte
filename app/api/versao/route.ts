export const dynamic = "force-dynamic";

// Which commit is live (2026-11-04). Vercel once skipped a push to main (the
// GitHub webhook never fired), so `npm run conferir` polls this after every
// push and re-triggers the deploy when the live commit doesn't catch up.
export function GET() {
  return Response.json(
    { commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
