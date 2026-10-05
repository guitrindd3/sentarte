import { cookies } from "next/headers";
import { registrar, type Evento } from "@/lib/estatisticas";

export const dynamic = "force-dynamic";

const ROBO = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|curl|python|headless|lighthouse/i;

// Light brake per server instance so nobody can flood the free quota.
const porIp = new Map<string, { n: number; desde: number }>();
function demais(ip: string) {
  const agora = Date.now();
  const r = porIp.get(ip);
  if (!r || agora - r.desde > 60_000) {
    if (porIp.size > 5000) porIp.clear();
    porIp.set(ip, { n: 1, desde: agora });
    return false;
  }
  return ++r.n > 120;
}

/** Anonymous visit/click/search counter for the admin's "Acessos" page. */
export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  // The atelier's own visits (logged into /admin) don't count.
  if (ROBO.test(ua) || demais(ip) || (await cookies()).has("sentarte_admin")) {
    return new Response(null, { status: 204 });
  }
  try {
    const corpo = (await req.text()).slice(0, 2000);
    const ev = JSON.parse(corpo) as Evento;
    if (ev && ["v", "c", "b", "a"].includes(ev.t)) await registrar(ev, req.headers);
  } catch (err) {
    console.error("estatisticas", err);
  }
  return new Response(null, { status: 204 });
}
