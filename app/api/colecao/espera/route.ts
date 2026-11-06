import { limiteDeCadastro } from "@/lib/clientes";
import { colecaoPublica, entrarNaEspera, idColecaoValido } from "@/lib/colecoes";
import { anotarNoCaminho, vidValido } from "@/lib/estatisticas";
import { emailValido, inscreverEmail } from "@/lib/lista-email";
import { redisAtivo } from "@/lib/redis";
import { ipDe } from "@/lib/seguranca";

export const dynamic = "force-dynamic";

/** POST {id, nome, email, aceito} → joins a collection's waiting list (and the e-mail list). */
export async function POST(req: Request) {
  if (!redisAtivo()) return Response.json({ erro: "Indisponível agora." }, { status: 503 });
  let corpo: { id?: string; nome?: string; email?: string; aceito?: boolean; site?: string; vid?: string };
  try {
    corpo = await req.json();
  } catch {
    return Response.json({ erro: "Dados inválidos." }, { status: 400 });
  }
  if (corpo.site) return Response.json({ ok: true }); // honeypot
  const email = emailValido(corpo.email);
  if (!email) return Response.json({ erro: "Confira o e-mail." }, { status: 400 });
  if (corpo.aceito !== true) return Response.json({ erro: "Marque que aceita receber o aviso por e-mail." }, { status: 400 });
  if (!idColecaoValido(corpo.id)) return Response.json({ erro: "Coleção não encontrada." }, { status: 404 });
  try {
    const c = await colecaoPublica(corpo.id);
    if (!c) return Response.json({ erro: "Coleção não encontrada." }, { status: 404 });
    if (await limiteDeCadastro(ipDe(req.headers))) return Response.json({ erro: "Muitos cadastros daqui. Tente mais tarde." }, { status: 429 });
    const nome = String(corpo.nome ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
    await entrarNaEspera(c.id, email);
    await inscreverEmail({ email, nome, origem: "colecao" });
    await anotarNoCaminho(vidValido(corpo.vid) ? corpo.vid : undefined, { k: "i", x: `lista de espera ${c.nome}` });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("colecao espera", err);
    return Response.json({ erro: "Não deu agora. Tente de novo." }, { status: 500 });
  }
}
