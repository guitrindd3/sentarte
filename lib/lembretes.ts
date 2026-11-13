import "server-only";
import { mandarEmailAoCliente } from "./avisos";
import { atualizarComMercadoPago, gravarPedido, lerPedido, pedidosRecentes, type PedidoCliente } from "./clientes";
import { getContent } from "./content-store";
import { SITE_URL } from "./nav";
import { formatBRL, PRAZO_PRODUCAO_DIAS_UTEIS } from "./offer";
import { noPagamento } from "./pedido";
import { linkRastreio } from "./rastreio";
import { redis, redisAtivo } from "./redis";
import { whatsappUrl } from "./urls";

// Automatic e-mails to customers (2026-11-05, user picked them from the sales
// ideas list: "recuperar quem desistiu" + "pedir avaliação sozinho"):
// - pagar1 / pagar2: started "Pagar agora" and didn't pay → about 1 h and
//   about 24 h later, a reminder with a link that puts the same chairs back
//   in the cart (/retomar/<ref>). Only the customer's newest order, never
//   after a later order, never after 72 h; Mercado Pago is asked first, so
//   a late payment never gets a reminder.
// - avaliar: 7 days after "entregue" (or 14 after "enviado" when nobody
//   marked it delivered) → asks for a review with a photo
//   (/acompanhar/<ref>#avaliar) and on Google.
// Sent from the atelier's Gmail (the one set up for sale alerts in
// /admin/avisos), each at most once per order (Redis SET NX). Each kind can
// be switched off in /admin/avisos. Nothing here runs on a timer of its own:
// a daily Vercel cron and the site's own visits (/api/e, at most every
// 10 min) call `talvezRodarLembretes()`. So "1 hora" means "the first visit
// after 1 hour" — fine for a small shop, and no paid scheduler needed.
//
// Order-step e-mails (2026-11-05, item 2 of the same list): confirmado (paid →
// in production), enviado (with the tracking code when there is one), rastreio
// (the code came out after "enviado" was already mailed) and entregue. These go
// right away: the admin actions and marcarPedido call `avisarEtapaAgora(ref)`;
// the timed job above only retries what failed. Only the order's current step
// is mailed (marking "entregue" straight away skips "enviado"), only within 3
// days of the step, and never for steps before ETAPAS_DESDE (older orders).

const H = 3600_000;
const DIA = 24 * H;
const K_CONFIG = "lembretes:config";
const K_VEZ = "lembretes:vez";
const K_ULTIMA = "lembretes:ultima";
const kFeito = (ref: string, tipo: string) => `pedido:${ref}:lembrete:${tipo}`;
const MAX_POR_RODADA = 10;
/** Steps before this (the feature's launch) never get an e-mail. */
const ETAPAS_DESDE = Date.UTC(2026, 10, 5, 14, 0);

export type ConfigLembretes = { pagar: boolean; avaliar: boolean; etapas: boolean };
export type UltimaRodada = { em: number; enviados: number };

export async function lerConfigLembretes(): Promise<ConfigLembretes> {
  const [bruto] = (await redis([["GET", K_CONFIG]])) as (string | null)[];
  try {
    if (bruto) return { pagar: true, avaliar: true, etapas: true, ...(JSON.parse(bruto) as Partial<ConfigLembretes>) };
  } catch {}
  return { pagar: true, avaliar: true, etapas: true };
}

export async function salvarConfigLembretes(c: ConfigLembretes) {
  await redis([["SET", K_CONFIG, JSON.stringify(c)]]);
}

export async function ultimaRodada(): Promise<UltimaRodada | null> {
  const [bruto] = (await redis([["GET", K_ULTIMA]])) as (string | null)[];
  try {
    return bruto ? (JSON.parse(bruto) as UltimaRodada) : null;
  } catch {
    return null;
  }
}

export type EtapaEmail = "confirmado" | "enviado" | "rastreio" | "entregue";
export type Tipo = "pagar1" | "pagar2" | "avaliar" | EtapaEmail;

const cadeirasDo = (p: PedidoCliente) => (p.porTipo ? p.porTipo.normal + p.porTipo.infantil + p.porTipo.reclinavel : 0);
const emailDo = (p: PedidoCliente) => {
  const e = p.entrega?.email?.trim().toLowerCase();
  return e && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : null;
};
const primeiroNome = (n: string) => n.trim().split(/\s+/)[0] ?? "";

/** Which reminder (if any) this order is due for now. */
export function lembreteDevido(p: PedidoCliente, todos: PedidoCliente[], cfg: ConfigLembretes, agora = Date.now()): Tipo | null {
  if (!emailDo(p)) return null;
  const etapa = cfg.etapas ? etapaDevida(p, agora) : null;
  if (etapa) return etapa;
  if (p.origem === "painel") return null;
  const l = p.lembretes ?? {};
  if (p.status !== "pago") {
    if (!cfg.pagar) return null;
    // the customer tried again later: only the newest attempt gets reminders
    const mesmo = (q: PedidoCliente) => q.ref !== p.ref && (q.whatsapp === p.whatsapp || (emailDo(q) && emailDo(q) === emailDo(p)));
    if (todos.some((q) => mesmo(q) && q.em > p.em)) return null;
    const idade = agora - p.em;
    if (idade >= H && idade < DIA && !l.pagar1 && !l.pagar2) return "pagar1";
    if (idade >= DIA && idade < 3 * DIA && !l.pagar2 && (!l.pagar1 || agora - l.pagar1 >= 12 * H)) return "pagar2";
    return null;
  }
  if (!cfg.avaliar || l.avaliar || cadeirasDo(p) === 0) return null;
  const entregue = p.etapa === "entregue" ? p.etapaEm?.entregue : undefined;
  const enviado = p.etapa === "enviado" ? p.etapaEm?.enviado : undefined;
  const base = entregue ? entregue + 7 * DIA : enviado ? enviado + 14 * DIA : undefined;
  // a late start (e.g. the feature is new) still asks, but not months later
  if (base && agora >= base && agora - base < 45 * DIA) return "avaliar";
  return null;
}

const codigoLimpo = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 60);

/** The order-step e-mail this order is due for now (only its current step). */
export function etapaDevida(p: PedidoCliente, agora = Date.now()): EtapaEmail | null {
  if (p.status !== "pago" || !emailDo(p) || cadeirasDo(p) === 0) return null;
  const l = p.lembretes ?? {};
  const recente = (t?: number, dias = 3) => !!t && t >= ETAPAS_DESDE && agora - t < dias * DIA;
  const etapa = p.etapa ?? "producao";
  if (etapa === "entregue") return !l.entregue && recente(p.etapaEm?.entregue) ? "entregue" : null;
  if (etapa === "enviado") {
    const quando = p.etapaEm?.enviado;
    if (!l.enviado) return recente(quando) ? "enviado" : null;
    // one tracking e-mail per order (user 2026-11-13: never twice on the same subject unless asked)
    const novo = !!p.rastreio && !l.rastreio && !l.rastreioAvisado;
    return novo && recente(quando, 10) ? "rastreio" : null;
  }
  // a sale typed in the admin was agreed on WhatsApp: no "payment received" e-mail
  return !l.confirmado && p.origem !== "painel" && recente(p.pagoEm) ? "confirmado" : null;
}

/**
 * "Reenviar o e-mail" in the admin order (2026-11-13): the only way an e-mail
 * on a subject the customer already got goes out again — the current step's
 * e-mail ("enviado" carries the tracking code when there is one).
 */
export async function reenviarEmailDaEtapa(ref: string): Promise<string> {
  const p = await lerPedido(ref);
  if (!p) return "Pedido não encontrado.";
  if (p.status !== "pago") return "Esse pedido ainda não foi pago.";
  if (!emailDo(p)) return "Esse pedido não tem e-mail da cliente.";
  const etapa = p.etapa ?? "producao";
  const tipo: EtapaEmail = etapa === "producao" ? "confirmado" : etapa;
  await redis([["DEL", kFeito(ref, tipo)]]);
  const { site } = await getContent();
  const r = await enviar(p, tipo, site);
  return r === "ok" ? "E-mail reenviado para a cliente." : r === "sem-gmail" ? "O e-mail do ateliê não está ligado (Avisos e envio)." : "Não deu para enviar agora. Tente de novo em alguns minutos.";
}

/** Called right after the step changes (payment, admin buttons): mails it now. Never throws. */

export async function avisarEtapaAgora(ref: string) {
  if (!redisAtivo()) return;
  try {
    const p = await lerPedido(ref);
    if (!p) return;
    const cfg = await lerConfigLembretes();
    const tipo = cfg.etapas ? etapaDevida(p) : null;
    if (!tipo) return;
    const { site } = await getContent();
    await enviar(p, tipo, site);
  } catch (err) {
    console.error("avisarEtapaAgora", ref, err);
  }
}

/** Sends one e-mail, at most once per order (Redis guard). */
async function enviar(p: PedidoCliente, tipo: Tipo, site: Site): Promise<"ok" | "ja" | "sem-gmail" | "erro"> {
  const chave = kFeito(p.ref, tipo);
  const [livre] = await redis([["SET", chave, 1, "NX", "EX", 90 * 24 * 3600]]);
  if (livre !== "OK") return "ja";
  try {
    const m = mensagem(tipo, p, site);
    if (!(await mandarEmailAoCliente(emailDo(p)!, m.assunto, m.texto, m.html))) {
      await redis([["DEL", chave]]);
      return "sem-gmail";
    }
    // re-read, so a change made meanwhile in the admin isn't overwritten
    const atual = (await lerPedido(p.ref)) ?? p;
    atual.lembretes = { ...atual.lembretes, [tipo]: Date.now() };
    if ((tipo === "enviado" || tipo === "rastreio") && p.rastreio) atual.lembretes.rastreioAvisado = codigoLimpo(p.rastreio);
    p.lembretes = atual.lembretes;
    await gravarPedido(atual);
    return "ok";
  } catch (err) {
    console.error("lembrete", tipo, p.ref, err);
    await redis([["DEL", chave]]); // try again next round
    return "erro";
  }
}

/** Runs if nobody ran it in the last 10 minutes (cheap to call often). */
let ultimaTentativa = 0;
export async function talvezRodarLembretes() {
  if (!redisAtivo() || Date.now() - ultimaTentativa < 5 * 60_000) return;
  ultimaTentativa = Date.now();
  try {
    const [vez] = await redis([["SET", K_VEZ, 1, "NX", "EX", 600]]);
    if (vez !== "OK") return;
    await rodarLembretes();
    // e-mail campaigns waiting in line (lazy import: lib/campanhas.ts imports this file)
    await import("./campanhas").then((m) => m.processarCampanhas(40_000));
  } catch (err) {
    console.error("lembretes", err);
  }
}

export async function rodarLembretes(): Promise<number> {
  const cfg = await lerConfigLembretes();
  let enviados = 0;
  if (cfg.pagar || cfg.avaliar || cfg.etapas) {
    const todos = await pedidosRecentes(200);
    let devidos = todos.filter((p) => lembreteDevido(p, todos, cfg));
    // a payment may have gone through without the customer coming back: ask Mercado Pago first
    await atualizarComMercadoPago(devidos.filter((p) => p.status !== "pago"));
    devidos = devidos.filter((p) => lembreteDevido(p, todos, cfg));
    if (devidos.length) {
      const { site } = await getContent();
      for (const p of devidos.slice(0, MAX_POR_RODADA)) {
        const tipo = lembreteDevido(p, todos, cfg);
        if (!tipo) continue;
        const r = await enviar(p, tipo, site);
        if (r === "sem-gmail") break;
        if (r === "ok") enviados++;
      }
    }
  }
  await redis([["SET", K_ULTIMA, JSON.stringify({ em: Date.now(), enviados } satisfies UltimaRodada)]]);
  return enviados;
}

// --- the e-mails ---------------------------------------------------------------------

type Site = { whatsappNumero: string; googleUrl?: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function mensagem(tipo: Tipo, p: PedidoCliente, site: Site) {
  const nome = primeiroNome(p.nome);
  if (tipo === "confirmado" || tipo === "enviado" || tipo === "rastreio" || tipo === "entregue") return mensagemEtapa(tipo, p, site, nome);
  const zap = whatsappUrl(site.whatsappNumero, tipo === "avaliar" ? "Oi! Recebi a minha cadeira e queria falar com vocês." : "Oi! Comecei um pedido no site e fiquei com uma dúvida.");
  if (tipo === "avaliar") {
    const link = `${SITE_URL}/acompanhar/${p.ref}#avaliar`;
    const paragrafos = [
      `Oi, ${nome}! Esperamos que você esteja curtindo a sua cadeira.`,
      "Cada uma é trançada à mão aqui no ateliê, e saber como ela ficou na sua casa faz toda a diferença pra gente. Conta como ficou? Leva 1 minutinho, e se quiser dá para mandar uma foto com ela.",
    ];
    const depois = [
      site.googleUrl ? `Se puder, avalie também no Google: ${site.googleUrl}` : "",
      "Se alguma coisa não ficou do jeito que você esperava, é só responder este e-mail que a gente resolve.",
    ].filter(Boolean);
    return montar(`Como ficou a sua cadeira, ${nome}?`, paragrafos, [], { texto: "Avaliar a minha cadeira", link }, depois, "Um abraço do Ateliê SentArte.", site.googleUrl);
  }
  const link = `${SITE_URL}/retomar/${p.ref}`;
  const primeiro = tipo === "pagar1";
  const paragrafos = primeiro
    ? [`Oi, ${nome}! Vimos que você começou um pedido no site da SentArte, mas o pagamento não foi concluído. Guardamos tudo para você:`]
    : [`Oi, ${nome}! A sua cadeira continua guardada, é só concluir o pagamento. Cada uma é trançada à mão e as vagas de produção da semana são poucas:`];
  const itens = [...p.itens.map((i) => i.replace(/ — desenho: \S+$/, "")), `Total: ${formatBRL(p.valor)} ${noPagamento(p.forma)}`];
  const depois = [`Ficou com dúvida sobre modelo, cor ou frete? Responda este e-mail ou chame a gente no WhatsApp: ${zap}`];
  const rodape = primeiro ? "Se você já pagou ou desistiu, é só ignorar este e-mail." : "Este é o último lembrete sobre esse pedido. Se você já pagou ou desistiu, é só ignorar.";
  return montar(
    primeiro ? `${nome}, sua cadeira ficou esperando` : `Ainda dá tempo, ${nome}: sua cadeira está guardada`,
    paragrafos,
    itens,
    { texto: "Concluir meu pedido", link },
    depois,
    rodape
  );
}

function mensagemEtapa(tipo: EtapaEmail, p: PedidoCliente, site: Site, nome: string) {
  const acompanhar = `${SITE_URL}/acompanhar/${p.ref}`;
  const zap = whatsappUrl(site.whatsappNumero, "Oi! Tenho uma dúvida sobre o meu pedido.");
  const duvida = `Qualquer dúvida, é só responder este e-mail ou chamar a gente no WhatsApp: ${zap}`;
  const codigo = p.rastreio?.trim();
  const pela = p.transportadora ? ` pela ${p.transportadora}` : "";
  if (tipo === "confirmado") {
    return montar(
      `Pedido confirmado, ${nome}! Sua cadeira vai começar a ser feita`,
      [
        `Oi, ${nome}! Recebemos o seu pagamento. Muito obrigado por escolher a SentArte!`,
        `Agora a sua cadeira entra na produção do ateliê. Ela é trançada à mão e fica pronta em até ${PRAZO_PRODUCAO_DIAS_UTEIS} dias úteis. Quando sair daqui, você recebe outro e-mail com o código de rastreio.`,
      ],
      [...p.itens.map((i) => i.replace(/ — desenho: \S+$/, "")), `Total: ${formatBRL(p.valor)} ${noPagamento(p.forma)}`],
      { texto: "Acompanhar meu pedido", link: acompanhar },
      ["Na página do pedido você vê cada etapa e as fotos da sua cadeira sendo feita, quando a gente postar.", duvida],
      "Um abraço do Ateliê SentArte."
    );
  }
  if (tipo === "enviado" || tipo === "rastreio") {
    const primeiro = tipo === "enviado";
    return montar(
      primeiro ? `Sua cadeira saiu do ateliê, ${nome}!` : `Saiu o código de rastreio da sua cadeira, ${nome}`,
      primeiro
        ? [
            `Oi, ${nome}! A sua cadeira ficou pronta e já foi enviada${pela}.`,
            codigo
              ? "Este é o código para acompanhar a entrega:"
              : "Assim que a transportadora liberar o código de rastreio, a gente te manda por aqui. Ele também aparece na página do pedido.",
          ]
        : [`Oi, ${nome}! A transportadora liberou o código para acompanhar a entrega da sua cadeira:`],
      codigo ? [`Código de rastreio: ${codigo}`] : [],
      codigo ? { texto: "Ver onde está a minha cadeira", link: linkRastreio(codigo.split(",")[0]) } : { texto: "Acompanhar meu pedido", link: acompanhar },
      [codigo ? `Também dá para ver tudo na página do pedido: ${acompanhar}` : "", duvida].filter(Boolean),
      codigo ? "O rastreio pode levar até 1 dia útil para mostrar o primeiro movimento. Um abraço do Ateliê SentArte." : "Um abraço do Ateliê SentArte."
    );
  }
  return montar(
    `Sua cadeira chegou, ${nome}!`,
    [
      `Oi, ${nome}! A sua cadeira foi entregue. Esperamos que você ame cada detalhe, ela foi feita com muito carinho aqui no ateliê.`,
      "Se alguma coisa não chegou do jeito que você esperava, responda este e-mail que a gente resolve.",
    ],
    [],
    { texto: "Ver meu pedido", link: acompanhar },
    [duvida],
    "Obrigado pela confiança. Um abraço do Ateliê SentArte."
  );
}

/** The look shared by every customer e-mail (also lib/campanhas.ts). `sair` = unsubscribe link (list e-mails only). */
export function montar(
  assunto: string,
  paragrafos: string[],
  itens: string[],
  botao: { texto: string; link: string },
  depois: string[],
  rodape: string,
  googleUrl?: string,
  sair?: string
) {
  const fimSair = sair ? ["", `Não quer mais receber estes e-mails? ${sair}`] : [];
  const texto = [...paragrafos, "", ...itens.map((i) => `- ${i}`), "", `${botao.texto}: ${botao.link}`, "", ...depois, "", rodape, "", "Ateliê SentArte", SITE_URL, ...fimSair]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");
  const linkar = (s: string) => esc(s).replace(/(https:\/\/[^\s<]+)/g, (u) => {
    const rotulo = u.includes("wa.me") ? "WhatsApp" : u.includes("/acompanhar/") ? "abrir a página do pedido" : googleUrl && u === esc(googleUrl) ? "avaliar no Google" : u;
    return `<a href="${u}" style="color:#177a42">${rotulo}</a>`;
  });
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#faf7f2;font-family:Georgia,'Times New Roman',serif;color:#241f1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fffefb;border:1px solid #d9c9ac">
<tr><td style="padding:22px 28px;border-bottom:1px solid #d9c9ac;font-size:20px;letter-spacing:.5px">Ateliê SentArte</td></tr>
<tr><td style="padding:24px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55">
${paragrafos.map((t) => `<p style="margin:0 0 14px">${esc(t)}</p>`).join("")}
${itens.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;border-top:1px solid #d9c9ac">${itens
    .map((t, i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #d9c9ac;${i === itens.length - 1 ? "font-weight:bold" : ""}">${esc(t)}</td></tr>`)
    .join("")}</table>` : ""}
<p style="margin:8px 0 22px"><a href="${esc(botao.link)}" style="display:inline-block;background:#1f9d55;color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:999px">${esc(botao.texto)}</a></p>
${depois.map((t) => `<p style="margin:0 0 12px">${linkar(t)}</p>`).join("")}
<p style="margin:18px 0 0;color:#5c584f;font-size:13px">${esc(rodape)}</p>
</td></tr>
<tr><td style="padding:14px 28px;border-top:1px solid #d9c9ac;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#5c584f"><a href="${SITE_URL}" style="color:#5c584f">${SITE_URL.replace(/^https:\/\//, "")}</a>${sair ? ` · <a href="${esc(sair)}" style="color:#5c584f">Não quero mais receber estes e-mails</a>` : ""}</td></tr>
</table></td></tr></table></body></html>`;
  return { assunto, texto, html };
}

/** Preview for the admin (/admin/avisos "ver como fica"): the e-mail for a made-up order. */
export function exemploDeLembrete(tipo: Tipo, site: Site) {
  const p: PedidoCliente = {
    ref: "exemplo-0000",
    em: Date.now(),
    nome: "Maria Silva",
    whatsapp: "",
    cidade: "Vitória/ES",
    forma: "pix",
    itens: ["1x Cadeira Sol e Lua"],
    valor: 389.9,
    status: "aguardando",
    transportadora: "Jadlog",
    rastreio: "AB123456789BR",
  };
  return mensagem(tipo, p, site);
}
