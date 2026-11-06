import { colecoesPublicas } from "@/lib/colecoes";
import { redisAtivo } from "@/lib/redis";

export const dynamic = "force-dynamic";

/** GET → the numbered collections visitors can see, with how many are left (lib/colecoes.ts). */
export async function GET() {
  const cabecalhos = { headers: { "Cache-Control": "public, max-age=0, s-maxage=20, stale-while-revalidate=40" } };
  if (!redisAtivo()) return Response.json({ colecoes: [] }, cabecalhos);
  try {
    const colecoes = (await colecoesPublicas()).map((c) => ({ ...c, descricao: undefined }));
    return Response.json({ colecoes }, cabecalhos);
  } catch {
    return Response.json({ colecoes: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
