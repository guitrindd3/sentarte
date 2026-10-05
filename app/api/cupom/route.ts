import { NextResponse } from "next/server";
import { buscarCupom, cuponsAutomaticos } from "@/lib/cupons-store";
import { ipDe } from "@/lib/seguranca";

export const dynamic = "force-dynamic";

// Light brake against guessing codes: 30 lookups per minute per IP (per instance).
const porIp = new Map<string, { n: number; desde: number }>();

/** GET → automatic coupons on offer; GET ?codigo=X → that coupon if usable. */
export async function GET(req: Request) {
  const codigo = new URL(req.url).searchParams.get("codigo");
  const sem = { headers: { "Cache-Control": "no-store" } };
  if (!codigo) return NextResponse.json({ automaticos: await cuponsAutomaticos() }, sem);

  const ip = ipDe(req.headers);
  const agora = Date.now();
  const r = porIp.get(ip);
  if (!r || agora - r.desde > 60_000) {
    if (porIp.size > 5000) porIp.clear();
    porIp.set(ip, { n: 1, desde: agora });
  } else if (++r.n > 30) {
    return NextResponse.json({ erro: "Muitas tentativas. Espere um minutinho." }, { status: 429 });
  }
  try {
    return NextResponse.json(await buscarCupom(codigo), sem);
  } catch {
    return NextResponse.json({ erro: "Não deu para conferir o cupom agora." }, { status: 503 });
  }
}
