import { verifySession } from "@/lib/auth";
import { githubConfigurado, ultimosCommits } from "@/lib/github-store";

export const dynamic = "force-dynamic";

// Admin "is my save live yet?" check (2026-10-05): this deploy's own commit
// (VERCEL_GIT_COMMIT_SHA) vs. the newest commit on main. Different = a newer
// save is still building; the production alias only moves once it's ready.
export async function GET() {
  if (!(await verifySession())) return Response.json({ erro: "sessão expirada" }, { status: 401 });
  const noAr = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  if (!githubConfigurado() || !noAr) return Response.json({ estado: "desconhecido" });
  try {
    const [ultimo] = await ultimosCommits(1);
    return Response.json(
      { estado: ultimo && ultimo.sha !== noAr ? "publicando" : "no-ar", desde: ultimo?.data ?? null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ estado: "desconhecido" });
  }
}
