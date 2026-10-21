import { fotoDaProducao } from "@/lib/fotos-producao";
import { redisAtivo } from "@/lib/redis";

// A production photo of one order (lib/fotos-producao.ts). The order's random
// reference in the URL is the secret, same as /acompanhar/<ref>.
export async function GET(_req: Request, { params }: { params: Promise<{ ref: string; id: string }> }) {
  const { ref, id } = await params;
  if (!redisAtivo()) return new Response(null, { status: 404 });
  const dataUrl = await fotoDaProducao(ref, id).catch(() => null);
  const m = dataUrl ? /^data:image\/jpeg;base64,(.+)$/.exec(dataUrl) : null;
  if (!m) return new Response(null, { status: 404 });
  return new Response(Buffer.from(m[1], "base64"), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400", "X-Robots-Tag": "noindex" },
  });
}
