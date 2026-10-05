import { guardarAvaliacao, limiteDeAvaliacao } from "@/lib/avaliacoes";
import { anotarNoCaminho, vidValido } from "@/lib/estatisticas";
import { redisAtivo } from "@/lib/redis";
import { ipDe } from "@/lib/seguranca";

export const dynamic = "force-dynamic";

/** A customer's review from the site; shown only after the admin approves it. */
export async function POST(req: Request) {
  if (!redisAtivo()) return Response.json({ erro: "Avaliações indisponíveis agora." }, { status: 503 });
  let c: { nome?: string; cidade?: string; texto?: string; estrelas?: number; site?: string; vid?: string };
  try {
    c = await req.json();
  } catch {
    return Response.json({ erro: "Dados inválidos." }, { status: 400 });
  }
  if (c.site) return Response.json({ ok: true }); // honeypot
  const limpa = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const nome = limpa(c.nome, 60);
  const cidade = limpa(c.cidade, 60);
  const texto = String(c.texto ?? "").replace(/\r\n/g, "\n").trim().slice(0, 600);
  const estrelas = Math.round(Number(c.estrelas));
  if (!(estrelas >= 1 && estrelas <= 5)) return Response.json({ erro: "Escolha de 1 a 5 estrelas." }, { status: 400 });
  if (!nome) return Response.json({ erro: "Escreva seu nome." }, { status: 400 });
  if (texto.length < 3) return Response.json({ erro: "Conte um pouquinho como ficou a sua cadeira." }, { status: 400 });
  try {
    if (await limiteDeAvaliacao(ipDe(req.headers))) return Response.json({ erro: "Você já mandou avaliações hoje. Obrigado!" }, { status: 429 });
    await guardarAvaliacao({ nome, cidade: cidade || undefined, texto, estrelas, vid: vidValido(c.vid) ? c.vid : undefined });
    await anotarNoCaminho(c.vid, { k: "c", x: `Mandou uma avaliação (${estrelas} estrelas)` });
  } catch (err) {
    console.error("avaliacoes", err);
    return Response.json({ erro: "Não deu para enviar agora. Tente de novo." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
