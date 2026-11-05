import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { naBlackFriday } from "./black-friday";
import { configBlackFriday, listarCupons, motivoInvalido, type CupomComUsos } from "./cupons-store";
import { rotuloDesconto, type Cupom } from "./cupom";
import { diaBR } from "./estatisticas";
import { SITE_URL } from "./nav";
import { redis } from "./redis";

// The e-mail list (2026-11-05, user picked "cupom para quem vai sair" + "campanhas
// para quem já comprou"). Only people who ticked a consent box are on it:
// - "janela": the welcome-coupon window (components/janela-cupom.tsx) — they
//   get a one-use coupon for the first order in exchange;
// - "compra": the "quero receber novidades por e-mail" box at checkout.
// Older buyers never agreed, so they are NOT on it. Campaigns (lib/campanhas.ts)
// go only to this list, and every one carries a one-click unsubscribe link
// (/sair-da-lista, signed with SESSION_SECRET). Leaving puts the address in
// `emails:sair`, so a stray signup elsewhere doesn't sneak it back without a
// new explicit tick.

const K = {
  lista: "emails:lista",
  sair: "emails:sair",
  config: "boasvindas:config",
  cupons: "boasvindas:cupons",
  porEmail: "boasvindas:por-email",
  usos: "cupons:usos",
};

export type OrigemEmail = "janela" | "compra";
export type Assinante = { email: string; nome?: string; em: number; origem: OrigemEmail };

export const emailValido = (e: unknown) => {
  const s = String(e ?? "").trim().toLowerCase().slice(0, 120);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? s : null;
};

/** Adds someone who just ticked a consent box (that tick also undoes an old "sair"). */
export async function inscreverEmail(a: { email: string; nome?: string; origem: OrigemEmail }) {
  const email = emailValido(a.email);
  if (!email) return;
  const [atual] = (await redis([["HGET", K.lista, email]])) as (string | null)[];
  let antes: Assinante | null = null;
  try {
    if (atual) antes = JSON.parse(atual) as Assinante;
  } catch {}
  const nome = a.nome?.replace(/\s+/g, " ").trim().slice(0, 60) || antes?.nome || undefined;
  const dados: Assinante = { email, nome, em: antes?.em ?? Date.now(), origem: antes?.origem ?? a.origem };
  await redis([["HSET", K.lista, email, JSON.stringify(dados)], ["SREM", K.sair, email]]);
}

export async function removerEmail(email: string) {
  const e = emailValido(email);
  if (!e) return;
  await redis([["HDEL", K.lista, e], ["SADD", K.sair, e]]);
}

export async function listarAssinantes(): Promise<Assinante[]> {
  const [bruto] = (await redis([["HGETALL", K.lista]])) as string[][];
  const lista: Assinante[] = [];
  for (let i = 0; i + 1 < (bruto ?? []).length; i += 2) {
    try {
      lista.push(JSON.parse(bruto[i + 1]) as Assinante);
    } catch {}
  }
  return lista.sort((a, b) => b.em - a.em);
}

// --- unsubscribe link -------------------------------------------------------------

const assinar = (email: string) => createHmac("sha256", `sair|${process.env.SESSION_SECRET ?? ""}`).update(email).digest("base64url").slice(0, 22);

export function linkSair(email: string) {
  return `${SITE_URL}/sair-da-lista?e=${encodeURIComponent(Buffer.from(email).toString("base64url"))}&t=${assinar(email)}`;
}

/** The e-mail in a /sair-da-lista link, if the signature matches. */
export function emailDoLinkSair(e: unknown, t: unknown): string | null {
  try {
    const email = emailValido(Buffer.from(String(e ?? ""), "base64url").toString());
    if (!email) return null;
    const a = Buffer.from(assinar(email));
    const b = Buffer.from(String(t ?? ""));
    return a.length === b.length && timingSafeEqual(a, b) ? email : null;
  } catch {
    return null;
  }
}

// --- welcome coupon ----------------------------------------------------------------
// The window gives either one of the atelier's own coupons (`cupom`, picked in
// /admin/campanhas — user 2026-11-05: "já tem alguns cupons, quero que use
// eles") or, with none picked, a fresh one-use code of `percentual` % per person.

export type ConfigBoasVindas = { ligado: boolean; percentual: number; dias: number; cupom?: string };
const PADRAO: ConfigBoasVindas = { ligado: true, percentual: 5, dias: 30 };

export async function lerConfigBoasVindas(): Promise<ConfigBoasVindas> {
  const [bruto] = (await redis([["GET", K.config]])) as (string | null)[];
  try {
    if (bruto) return { ...PADRAO, ...(JSON.parse(bruto) as Partial<ConfigBoasVindas>) };
  } catch {}
  return PADRAO;
}

export async function salvarConfigBoasVindas(c: ConfigBoasVindas) {
  await redis([["SET", K.config, JSON.stringify(c)]]);
}

const dataBR = (iso: string) => iso.split("-").reverse().join("/");
const condicaoDe = (minCadeiras: number) => (minCadeiras > 1 ? `levando ${minCadeiras} cadeiras ou mais` : "em qualquer cadeira do site");

/** What the window offers right now, in words for the customer. */
export type Oferta = {
  /** "10%" or "R$ 50,00" */
  rotulo: string;
  condicao: string;
  /** "Vale por 30 dias." / "Vale até 31/12." / "" */
  validade: string;
  /** The atelier's own coupon, when one is picked. */
  existente?: CupomComUsos;
};

export type SituacaoJanela = { cfg: ConfigBoasVindas; oferta: Oferta | null; motivo: null | "desligado" | "blackfriday" | "cupom" };

/** Whether the window may show now and with what (admin page explains `motivo`). */
export async function situacaoJanela(): Promise<SituacaoJanela> {
  const cfg = await lerConfigBoasVindas();
  if (!cfg.ligado) return { cfg, oferta: null, motivo: "desligado" };
  // Black Friday week: only its discount works, typed coupons are refused
  const bf = await configBlackFriday();
  if (bf.ligado && naBlackFriday(diaBR(), bf.inicioAntecipado)) return { cfg, oferta: null, motivo: "blackfriday" };
  if (cfg.cupom) {
    const c = (await listarCupons()).find((x) => x.codigo === cfg.cupom);
    if (!c || c.vale || motivoInvalido(c)) return { cfg, oferta: null, motivo: "cupom" };
    return {
      cfg,
      oferta: { rotulo: rotuloDesconto(c), condicao: condicaoDe(c.minCadeiras), validade: c.validoAte ? `Vale até ${dataBR(c.validoAte)}.` : "", existente: c },
      motivo: null,
    };
  }
  if (cfg.percentual <= 0) return { cfg, oferta: null, motivo: "desligado" };
  return {
    cfg,
    oferta: { rotulo: `${cfg.percentual.toLocaleString("pt-BR")}%`, condicao: condicaoDe(1), validade: `Vale por ${cfg.dias} dias.` },
    motivo: null,
  };
}

const LETRAS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
const novoCodigo = () => `OLA${Array.from({ length: 6 }, () => LETRAS[randomInt(LETRAS.length)]).join("")}`;

function somarDias(dia: string, n: number) {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export type CupomDaJanela = { codigo: string; rotulo: string; condicao: string; validoAte?: string; novo: boolean };

/**
 * The coupon this e-mail gets. The same address gets the same code back (no
 * new one per signup, no second welcome e-mail). A fresh one-use code is kept
 * apart from the admin's coupons (`boasvindas:cupons`) so the Cupons page
 * doesn't fill up; lib/cupons-store.ts `buscarCupom` looks there too.
 */
export async function cupomDaJanela(email: string, s: SituacaoJanela & { oferta: Oferta }): Promise<CupomDaJanela> {
  const { cfg, oferta } = s;
  const [ja] = (await redis([["HGET", K.porEmail, email]])) as (string | null)[];
  if (ja && ja === oferta.existente?.codigo) return { codigo: ja, rotulo: oferta.rotulo, condicao: oferta.condicao, validoAte: oferta.existente.validoAte, novo: false };
  if (ja && !oferta.existente) {
    const c = await lerCupomDeBoasVindas(ja);
    if (c) return { codigo: c.codigo, rotulo: rotuloDesconto(c), condicao: condicaoDe(c.minCadeiras), validoAte: c.validoAte, novo: false };
  }
  if (oferta.existente) {
    await redis([["HSET", K.porEmail, email, oferta.existente.codigo]]);
    return { codigo: oferta.existente.codigo, rotulo: oferta.rotulo, condicao: oferta.condicao, validoAte: oferta.existente.validoAte, novo: true };
  }
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = novoCodigo();
    const c: Cupom = {
      codigo,
      tipo: "percentual",
      valor: cfg.percentual,
      minCadeiras: 1,
      automatico: false,
      ativo: true,
      validoAte: somarDias(diaBR(), cfg.dias),
      limiteUsos: 1,
      descricao: `Boas-vindas: ${email}`,
      criadoEm: Date.now(),
    };
    const [ok] = await redis([["HSETNX", K.cupons, codigo, JSON.stringify(c)]]);
    if (Number(ok) === 1) {
      await redis([["HSET", K.porEmail, email, codigo]]);
      return { codigo, rotulo: rotuloDesconto(c), condicao: condicaoDe(1), validoAte: c.validoAte, novo: true };
    }
  }
  throw new Error("cupomDaJanela: sem código livre");
}

export async function lerCupomDeBoasVindas(codigo: string): Promise<Cupom | null> {
  const [bruto] = (await redis([["HGET", K.cupons, codigo]])) as (string | null)[];
  try {
    return bruto ? (JSON.parse(bruto) as Cupom) : null;
  } catch {
    return null;
  }
}

/** Admin numbers: people who took the window's coupon, and how many one-use codes became paid orders. */
export async function numerosBoasVindas() {
  const [pessoas, codigos] = (await redis([["HLEN", K.porEmail], ["HKEYS", K.cupons]])) as [number, string[]];
  if (!codigos?.length) return { pessoas: Number(pessoas) || 0, usados: 0 };
  const [usos] = (await redis([["HMGET", K.usos, ...codigos]])) as (string | null)[][];
  return { pessoas: Number(pessoas) || 0, usados: (usos ?? []).filter((u) => Number(u) > 0).length };
}
