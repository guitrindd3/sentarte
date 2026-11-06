import { fotoDaProducao } from "@/lib/fotos-producao";
import { lerPassaporte, numeroDoCodigo } from "@/lib/passaporte";
import { redisAtivo } from "@/lib/redis";

// A production photo shown on a chair's passport (/p/<codigo>). Goes through
// the passport's signed code so the page never reveals the order reference
// (which opens /acompanhar with the buyer's name and city).
export async function GET(_req: Request, { params }: { params: Promise<{ codigo: string; id: string }> }) {
  const { codigo, id } = await params;
  const n = numeroDoCodigo(codigo);
  if (!redisAtivo() || n === null) return new Response(null, { status: 404 });
  const p = await lerPassaporte(n).catch(() => null);
  const dataUrl = p ? await fotoDaProducao(p.ref, id).catch(() => null) : null;
  const m = dataUrl ? /^data:image\/jpeg;base64,(.+)$/.exec(dataUrl) : null;
  if (!m) return new Response(null, { status: 404 });
  return new Response(Buffer.from(m[1], "base64"), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400", "X-Robots-Tag": "noindex" },
  });
}
