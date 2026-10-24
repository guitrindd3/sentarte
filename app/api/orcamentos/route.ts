import { avisarOrcamento } from "@/lib/avisos";
import { normalizarWhatsapp } from "@/lib/clientes";
import { anotarNoCaminho } from "@/lib/estatisticas";
import { imagemDoOrcamento, limiteDeOrcamento, MAX_FOTOS_ORCAMENTO, salvarOrcamento } from "@/lib/orcamentos";
import { redisAtivo } from "@/lib/redis";
import { ipDe } from "@/lib/seguranca";

export const dynamic = "force-dynamic";

/**
 * /eventos quote form (2026-10-24): keeps the request and the customer's
 * logo/pictures for the admin "Orçamentos" page. The browser then opens
 * WhatsApp with the returned number in the message.
 */
export async function POST(req: Request) {
  if (!redisAtivo()) return Response.json({ erro: "indisponível" }, { status: 503 });
  let c: Record<string, unknown>;
  try {
    c = await req.json();
  } catch {
    return Response.json({ erro: "Dados inválidos." }, { status: 400 });
  }
  if (c.site) return Response.json({ codigo: "" }); // honeypot
  const limpa = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const contato = limpa(c.contato, 60);
  if (!contato) return Response.json({ erro: "Escreva o seu nome." }, { status: 400 });
  const n = (v: unknown) => Math.max(0, Math.min(500, Math.floor(Number(v) || 0)));
  const q = (c.qtd ?? {}) as Record<string, unknown>;
  const qtd = { normal: n(q.normal), infantil: n(q.infantil), reclinavel: n(q.reclinavel) };
  const brutas = Array.isArray(c.fotos) ? c.fotos.slice(0, MAX_FOTOS_ORCAMENTO) : [];
  const fotos = brutas.map(imagemDoOrcamento);
  if (fotos.some((f) => !f)) return Response.json({ erro: "Não deu para usar uma das imagens. Tente outra." }, { status: 400 });
  try {
    if (await limiteDeOrcamento(ipDe(req.headers))) return Response.json({ erro: "Muitos pedidos agora. Tente daqui a pouco." }, { status: 429 });
    const o = await salvarOrcamento(
      {
        tipo: limpa(c.tipo, 40) || "evento",
        contato,
        whatsapp: normalizarWhatsapp(String(c.whatsapp ?? "")) ?? undefined,
        nomeEvento: limpa(c.nomeEvento, 80) || undefined,
        data: /^\d{4}-\d{2}-\d{2}$/.test(String(c.data ?? "")) ? String(c.data) : undefined,
        cidade: limpa(c.cidade, 60) || undefined,
        qtd,
        nomes: limpa(c.nomes, 40) || undefined,
        cores: limpa(c.cores, 80) || undefined,
        ideia: String(c.ideia ?? "").replace(/\r\n/g, "\n").trim().slice(0, 600) || undefined,
      },
      fotos as string[]
    );
    const total = qtd.normal + qtd.infantil + qtd.reclinavel;
    await anotarNoCaminho(c.vid, { k: "c", x: `Pediu orçamento ${o.codigo}${o.fotos ? ` com ${o.fotos} imagem(ns)` : ""}` }).catch(() => {});
    await avisarOrcamento({ codigo: o.codigo, tipo: o.tipo, contato, cidade: o.cidade, fotos: o.fotos, total }).catch((err) => console.error("avisarOrcamento", err));
    return Response.json({ codigo: o.codigo });
  } catch (err) {
    console.error("orcamentos", err);
    return Response.json({ erro: "Não deu para enviar as imagens agora." }, { status: 500 });
  }
}
