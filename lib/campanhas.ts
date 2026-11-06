import "server-only";
import { abrirCorreio } from "./avisos";
import { diaBR } from "./estatisticas";
import { montar } from "./lembretes";
import { linkSair, listarAssinantes, type Assinante, type CupomDaJanela } from "./lista-email";
import { SITE_URL } from "./nav";
import { redis, redisAtivo } from "./redis";

// E-mail campaigns (2026-11-05): the atelier writes one e-mail in /admin/campanhas
// and it goes to everyone on the e-mail list (lib/lista-email.ts), one by one,
// from her Gmail, each with its own unsubscribe link (+ List-Unsubscribe
// headers, which Gmail wants for bulk mail). The recipients are copied into a
// Redis queue when she presses send; `processarCampanhas()` drains it in
// slices (right after sending, then from the same visit/cron job as the
// reminders), at most LIMITE_DIA per day: a personal Gmail allows ~500
// e-mails a day and the order e-mails need room too.

export const LIMITE_DIA = 300;
const FATIA_MS = 45_000;
const kc = (id: string) => `campanha:${id}`;
const kf = (id: string) => `campanha:${id}:fila`;
const kDia = () => `campanhas:dia:${diaBR()}`;

export type Campanha = {
  id: string;
  em: number;
  assunto: string;
  texto: string;
  botaoTexto?: string;
  botaoLink?: string;
  total: number;
  enviados: number;
  falhas: number;
  /** When the queue emptied. */
  fim?: number;
  /** Sent only to part of the list (e.g. a collection's waiting list). */
  publico?: string;
};

const primeiroNome = (n?: string) => n?.trim().split(/\s+/)[0] ?? "";

/** "{nome}" → first name; without a name, ", {nome}" and "{nome}" just disappear. */
function personalizar(s: string, nome: string) {
  return nome ? s.replace(/\{nome\}/gi, nome) : s.replace(/,?\s*\{nome\}/gi, "");
}

export function linkDoBotao(link?: string) {
  const l = (link ?? "").trim();
  if (!l) return SITE_URL;
  if (l.startsWith("/")) return `${SITE_URL}${l}`;
  if (/^https:\/\//i.test(l)) return l;
  if (/^[\w-]+(\.[\w-]+)+/.test(l)) return `https://${l}`;
  return SITE_URL;
}

export function emailDaCampanha(c: Pick<Campanha, "assunto" | "texto" | "botaoTexto" | "botaoLink">, para: Pick<Assinante, "email" | "nome">) {
  const nome = primeiroNome(para.nome);
  const paragrafos = personalizar(c.texto, nome)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  const sair = linkSair(para.email);
  const m = montar(
    personalizar(c.assunto, nome),
    paragrafos,
    [],
    { texto: c.botaoTexto?.trim() || "Ver as cadeiras", link: linkDoBotao(c.botaoLink) },
    [],
    "Você recebe este e-mail porque pediu novidades e cupons do Ateliê SentArte.",
    undefined,
    sair
  );
  const cabecalhos = {
    "List-Unsubscribe": `<${sair.replace("/sair-da-lista?", "/api/sair?")}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
  return { ...m, cabecalhos };
}

/** The e-mail with the welcome coupon (app/api/boas-vindas). */
export function emailBoasVindas(nome: string, email: string, cupom: Pick<CupomDaJanela, "codigo" | "rotulo" | "condicao" | "validoAte">) {
  const n = primeiroNome(nome);
  const ate = cupom.validoAte ? cupom.validoAte.split("-").reverse().join("/") : "";
  return montar(
    `${n ? `${n}, seu` : "Seu"} cupom de ${cupom.rotulo} está aqui`,
    [
      `Oi${n ? `, ${n}` : ""}! Que bom ter você por aqui. Este é o seu cupom para a primeira compra no Ateliê SentArte:`,
    ],
    [`Cupom ${cupom.codigo}: ${cupom.rotulo} de desconto ${cupom.condicao}${ate ? `, até ${ate}` : ""}`],
    { texto: "Escolher a minha cadeira", link: SITE_URL },
    [
      "No navegador onde você se cadastrou, o cupom já está no carrinho. Em outro celular ou computador, é só digitar o código no carrinho, em \"Tem cupom de desconto?\".",
      "Cada cadeira é trançada à mão aqui no ateliê. Se quiser ajuda para escolher modelo ou cores, é só responder este e-mail.",
    ],
    "Vale para pedidos pagos no site.",
    undefined,
    linkSair(email)
  );
}

// --- the queue -------------------------------------------------------------------------

export async function criarCampanha(
  dados: Pick<Campanha, "assunto" | "texto" | "botaoTexto" | "botaoLink">,
  /** Only these addresses (still on the list: whoever left is skipped). */
  so?: { emails: string[]; publico: string }
): Promise<Campanha> {
  const alvo = so ? new Set(so.emails) : null;
  const lista = (await listarAssinantes()).filter((a) => !alvo || alvo.has(a.email));
  if (!lista.length) throw new Error("lista vazia");
  const c: Campanha = { ...dados, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, em: Date.now(), total: lista.length, enviados: 0, falhas: 0, publico: so?.publico };
  const fila = lista.map((a) => a.email);
  const cmds: (string | number)[][] = [["SET", kc(c.id), JSON.stringify(c)], ["ZADD", "campanhas", c.em, c.id]];
  for (let i = 0; i < fila.length; i += 200) cmds.push(["RPUSH", kf(c.id), ...fila.slice(i, i + 200)]);
  await redis(cmds);
  return c;
}

export async function listarCampanhas(): Promise<Campanha[]> {
  const [ids] = (await redis([["ZREVRANGE", "campanhas", 0, 19]])) as string[][];
  if (!ids?.length) return [];
  const [brutos] = (await redis([["MGET", ...ids.map(kc)]])) as (string | null)[][];
  return (brutos ?? []).flatMap((b) => {
    try {
      return b ? [JSON.parse(b) as Campanha] : [];
    } catch {
      return [];
    }
  });
}

export async function enviadosHoje() {
  const [n] = await redis([["GET", kDia()]]);
  return Number(n) || 0;
}

/** Sends the next slice of every unfinished campaign. Cheap when there's nothing to do. */
export async function processarCampanhas(prazoMs = FATIA_MS): Promise<number> {
  if (!redisAtivo()) return 0;
  const pendentes = (await listarCampanhas()).filter((c) => !c.fim).reverse(); // oldest first
  if (!pendentes.length) return 0;
  const [vez] = await redis([["SET", "campanhas:vez", 1, "NX", "EX", 120]]);
  if (vez !== "OK") return 0;
  const inicio = Date.now();
  let enviados = 0;
  const correio = await abrirCorreio();
  try {
    if (!correio) return 0;
    const assinantes = new Map((await listarAssinantes()).map((a) => [a.email, a]));
    for (const c of pendentes) {
      while (Date.now() - inicio < prazoMs) {
        if ((await enviadosHoje()) >= LIMITE_DIA) {
          await redis([["SET", kc(c.id), JSON.stringify(c)]]);
          return enviados;
        }
        const [email] = (await redis([["LPOP", kf(c.id)]])) as (string | null)[];
        if (!email) {
          c.fim = Date.now();
          break;
        }
        const a = assinantes.get(email);
        if (!a) continue; // left the list meanwhile
        try {
          const m = emailDaCampanha(c, a);
          await correio.enviar(email, m.assunto, m.texto, m.html, m.cabecalhos);
          c.enviados++;
          enviados++;
          await redis([["INCR", kDia()], ["EXPIRE", kDia(), 3 * 24 * 3600]]);
        } catch (err) {
          console.error("campanha", c.id, err);
          c.falhas++;
          // Gmail refused (daily limit, login): put it back and stop for now
          if (/limit|quota|auth|login|421|454|550 5\.4\.5/i.test(String(err))) {
            await redis([["LPUSH", kf(c.id), email]]);
            c.falhas--;
            await redis([["SET", kc(c.id), JSON.stringify(c)]]);
            return enviados;
          }
        }
        if ((c.enviados + c.falhas) % 10 === 0) await redis([["SET", kc(c.id), JSON.stringify(c)]]);
      }
      await redis([["SET", kc(c.id), JSON.stringify(c)]]);
      if (!c.fim) break; // out of time
    }
    return enviados;
  } finally {
    correio?.fechar();
    await redis([["DEL", "campanhas:vez"]]);
  }
}
