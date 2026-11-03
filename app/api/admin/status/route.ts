import { verifySession } from "@/lib/auth";
import { githubConfigurado, ultimosCommits } from "@/lib/github-store";

export const dynamic = "force-dynamic";

// Admin "is my save live yet?" check (2026-10-05): this deploy's own commit
// (VERCEL_GIT_COMMIT_SHA) vs. the newest commit on main. Different = a newer
// save is still building; the production alias only moves once it's ready.
// `?sha=<commit>` (the panel's publish progress, 2026-11-03): live once the
// serving deploy is that commit or a newer one.
export async function GET(req: Request) {
  if (!(await verifySession())) return Response.json({ erro: "sessão expirada" }, { status: 401 });
  const noAr = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  if (!githubConfigurado() || !noAr) return Response.json({ estado: "desconhecido" });
  const sha = new URL(req.url).searchParams.get("sha");
  try {
    if (sha && /^[0-9a-f]{40}$/.test(sha)) {
      if (sha === noAr) return Response.json({ estado: "no-ar" }, { headers: { "Cache-Control": "no-store" } });
      const lista = (await ultimosCommits(20)).map((c) => c.sha);
      const i = lista.indexOf(sha);
      const j = lista.indexOf(noAr);
      // serving commit newer than ours (smaller index = newer) → ours is in it
      const estado = i !== -1 && j !== -1 && j < i ? "no-ar" : "publicando";
      return Response.json({ estado }, { headers: { "Cache-Control": "no-store" } });
    }
    const [ultimo] = await ultimosCommits(1);
    return Response.json(
      { estado: ultimo && ultimo.sha !== noAr ? "publicando" : "no-ar", desde: ultimo?.data ?? null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ estado: "desconhecido" });
  }
}
