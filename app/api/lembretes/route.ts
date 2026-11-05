import { talvezRodarLembretes } from "@/lib/lembretes";

export const dynamic = "force-dynamic";

// Daily Vercel cron (vercel.json) — a safety net for the reminder e-mails
// (lib/lembretes.ts); site visits run them too. Harmless if anyone calls it:
// it only sends what's due, once, and at most every 10 minutes.
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  if (segredo && req.headers.get("authorization") !== `Bearer ${segredo}`) return new Response(null, { status: 401 });
  await talvezRodarLembretes();
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
