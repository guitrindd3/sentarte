import { verifySession } from "@/lib/auth";
import { fotoDoOrcamento } from "@/lib/orcamentos";
import { redisAtivo } from "@/lib/redis";

export const dynamic = "force-dynamic";

// A picture a customer attached to an /eventos quote (lib/orcamentos.ts).
// Admin only: under /admin (proxy.ts) and the session is checked again here.
// `?baixar=1` downloads it, to draw the sketch.
export async function GET(req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  if (!(await verifySession())) return new Response(null, { status: 401 });
  const { id, n } = await params;
  if (!redisAtivo()) return new Response(null, { status: 404 });
  const dataUrl = await fotoDoOrcamento(id, Number(n)).catch(() => null);
  const m = dataUrl ? /^data:image\/jpeg;base64,(.+)$/.exec(dataUrl) : null;
  if (!m) return new Response(null, { status: 404 });
  const baixar = new URL(req.url).searchParams.has("baixar");
  return new Response(Buffer.from(m[1], "base64"), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=86400",
      "X-Robots-Tag": "noindex",
      ...(baixar ? { "Content-Disposition": `attachment; filename="orcamento-${id.slice(0, 6)}-${Number(n) + 1}.jpg"` } : {}),
    },
  });
}
