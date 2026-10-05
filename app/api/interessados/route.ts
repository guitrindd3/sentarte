import { limiteDeCadastro, normalizarWhatsapp, salvarInteressado } from "@/lib/clientes";
import { anotarNoCaminho, vidValido } from "@/lib/estatisticas";
import { redisAtivo } from "@/lib/redis";
import { ipDe } from "@/lib/seguranca";

export const dynamic = "force-dynamic";

/** "Novidades e cupons" sign-up (footer). Requires the consent checkbox. */
export async function POST(req: Request) {
  if (!redisAtivo()) return Response.json({ erro: "Cadastro indisponível agora." }, { status: 503 });
  let corpo: { nome?: string; whatsapp?: string; aceito?: boolean; site?: string; vid?: string };
  try {
    corpo = await req.json();
  } catch {
    return Response.json({ erro: "Dados inválidos." }, { status: 400 });
  }
  // Honeypot: real people never fill the hidden "site" field.
  if (corpo.site) return Response.json({ ok: true });
  const nome = String(corpo.nome ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  const whatsapp = normalizarWhatsapp(String(corpo.whatsapp ?? ""));
  if (!nome) return Response.json({ erro: "Escreva seu nome." }, { status: 400 });
  if (!whatsapp) return Response.json({ erro: "Confira o WhatsApp: DDD + número." }, { status: 400 });
  if (corpo.aceito !== true) return Response.json({ erro: "Marque que aceita receber as mensagens." }, { status: 400 });
  try {
    if (await limiteDeCadastro(ipDe(req.headers))) return Response.json({ erro: "Muitos cadastros daqui. Tente mais tarde." }, { status: 429 });
    await salvarInteressado({ nome, whatsapp, vid: vidValido(corpo.vid) ? corpo.vid : undefined });
    await anotarNoCaminho(corpo.vid, { k: "i", x: nome.split(" ")[0] });
  } catch (err) {
    console.error("interessados", err);
    return Response.json({ erro: "Não deu para cadastrar agora. Tente de novo." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
