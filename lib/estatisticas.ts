import "server-only";
import { createHash } from "crypto";
import { redis, redisAtivo, type Cmd } from "./redis";

// Site statistics (2026-10-05): the admin's "Acessos" dashboard. Vercel Web
// Analytics on Hobby can't record searches or clicks, so the site counts them
// itself in a free Upstash Redis (Vercel Marketplace, plan "free", auto-upgrade
// OFF so it can never bill). Anonymous: no cookie, no IP stored — a visitor is
// a one-day hash of IP + browser, only used inside a HyperLogLog to count
// unique visitors. Everything is a per-day counter that expires after ~13 months.

const VALIDADE_S = 400 * 24 * 3600;

export const estatisticasAtivas = redisAtivo;
const pipeline = redis;

/** YYYY-MM-DD in Brasília time. */
export function diaBR(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
}
function horaBR(d = new Date()) {
  return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(d));
}

const GRUPOS = ["geral", "pag", "ref", "disp", "busca", "clique", "carrinho", "hora", "local"] as const;
type Grupo = (typeof GRUPOS)[number];
const chave = (dia: string, g: Grupo | "vis") => `e:${dia}:${g}`;

/** `vid`: the visit (one browser tab session, random, see lib/rastro.ts). */
export type Evento = { vid?: string } & (
  | { t: "v"; p: string; r?: string; q?: string }
  | { t: "c"; l: string }
  | { t: "b"; q: string; onde?: string }
  | { t: "a"; m: string }
);

const limpar = (s: unknown, max = 60) =>
  String(s ?? "")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

function dispositivo(ua: string) {
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "Celular";
  return "Computador";
}

/** Where the visit came from, as a friendly name. */
function origem(ref: string | undefined, host: string) {
  if (!ref) return "Direto (link ou digitou)";
  let h = "";
  try {
    h = new URL(ref).hostname.replace(/^www\.|^m\.|^l\.|^lm\./, "");
  } catch {
    return "Direto (link ou digitou)";
  }
  if (!h || h === host) return null; // internal navigation
  if (/google\./.test(h)) return "Google";
  if (/instagram\.com/.test(h)) return "Instagram";
  if (/facebook\.com|fb\.com/.test(h)) return "Facebook";
  if (/whatsapp|wa\.me/.test(h)) return "WhatsApp";
  if (/bing\.com/.test(h)) return "Bing";
  if (/tiktok\.com/.test(h)) return "TikTok";
  if (/mercadopago|mercadolivre/.test(h)) return "Mercado Pago";
  return h;
}

export async function registrar(ev: Evento, h: Headers) {
  if (!estatisticasAtivas()) return;
  const agora = new Date();
  const dia = diaBR(agora);
  const cmds: Cmd[] = [];
  const toca = new Set<string>();
  const inc = (g: Grupo, campo: string, n = 1) => {
    const k = chave(dia, g);
    cmds.push(["HINCRBY", k, campo, n]);
    toca.add(k);
  };

  const ctx: { origem?: string; local?: string; disp?: string } = {};
  let passo: Passo | null = null;
  if (ev.t === "v") {
    const p = limpar(ev.p, 80) || "/";
    passo = { k: "v", x: p, q: ev.q ? limpar(ev.q, 40) : undefined };
    inc("geral", "views");
    inc("pag", p);
    inc("hora", String(horaBR(agora)));
    const ua = h.get("user-agent") ?? "";
    ctx.disp = dispositivo(ua);
    inc("disp", ctx.disp);
    const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim();
    const visitante = createHash("sha256")
      .update(`${process.env.SESSION_SECRET ?? ""}|${dia}|${ip}|${ua}`)
      .digest("hex")
      .slice(0, 16);
    const kv = chave(dia, "vis");
    cmds.push(["PFADD", kv, visitante]);
    toca.add(kv);
    const o = origem(ev.r, h.get("host") ?? "");
    if (o) {
      ctx.origem = o;
      inc("ref", o);
      // Count the visitor's town once per arrival from outside, not per page.
      const cidade = decodeURIComponent(h.get("x-vercel-ip-city") ?? "");
      const uf = h.get("x-vercel-ip-country-region") ?? "";
      const pais = h.get("x-vercel-ip-country") ?? "";
      if (cidade) {
        ctx.local = pais && pais !== "BR" ? `${cidade} (${pais})` : uf ? `${cidade} - ${uf}` : cidade;
        inc("local", ctx.local);
      }
    }
    if (ev.q) inc("busca", limpar(ev.q, 40).toLowerCase());
  } else if (ev.t === "c") {
    const l = limpar(ev.l);
    if (!l) return;
    inc("clique", l);
    passo = { k: "c", x: l };
  } else if (ev.t === "b") {
    const q = limpar(ev.q, 40).toLowerCase();
    if (q.length < 2) return;
    inc("busca", ev.onde === "trama" ? `${q} (Monte a sua trama)` : q);
    passo = { k: "b", x: q, q: ev.onde };
  } else if (ev.t === "a") {
    const m = limpar(ev.m);
    if (!m) return;
    inc("carrinho", m);
    inc("geral", "carrinho");
    passo = { k: "a", x: m };
  }
  for (const k of toca) cmds.push(["EXPIRE", k, VALIDADE_S]);
  if (passo && ev.vid) cmds.push(...cmdsDoCaminho(ev.vid, passo, ctx));
  await pipeline(cmds);
}

export type Contagem = { nome: string; n: number }[];
export type Relatorio = {
  dias: { dia: string; visitantes: number; views: number }[];
  visitantes: number;
  views: number;
  carrinho: number;
  whatsapp: number;
  grupos: Record<Exclude<Grupo, "geral">, Contagem>;
};

/** Everything the dashboard shows, for the last `n` days (today included). */
export async function relatorio(n: number): Promise<Relatorio> {
  const dias: string[] = [];
  for (let i = n - 1; i >= 0; i--) dias.push(diaBR(new Date(Date.now() - i * 86400000)));

  const cmds: Cmd[] = [];
  for (const d of dias) {
    for (const g of GRUPOS) cmds.push(["HGETALL", chave(d, g)]);
    cmds.push(["PFCOUNT", chave(d, "vis")]);
  }
  cmds.push(["PFCOUNT", ...dias.map((d) => chave(d, "vis"))]);
  const r = await pipeline(cmds);

  const soma: Record<string, Map<string, number>> = {};
  for (const g of GRUPOS) soma[g] = new Map();
  const porDia: Relatorio["dias"] = [];
  let i = 0;
  for (const d of dias) {
    let viewsDia = 0;
    for (const g of GRUPOS) {
      const arr = (r[i++] as string[] | null) ?? [];
      for (let j = 0; j + 1 < arr.length; j += 2) {
        const v = Number(arr[j + 1]) || 0;
        soma[g].set(arr[j], (soma[g].get(arr[j]) ?? 0) + v);
        if (g === "geral" && arr[j] === "views") viewsDia = v;
      }
    }
    porDia.push({ dia: d, views: viewsDia, visitantes: Number(r[i++]) || 0 });
  }
  const visitantes = Number(r[i]) || 0;

  const ordenar = (m: Map<string, number>): Contagem =>
    [...m].map(([nome, n]) => ({ nome, n })).sort((a, b) => b.n - a.n);
  const cliques = ordenar(soma.clique);

  return {
    dias: porDia,
    visitantes,
    views: soma.geral.get("views") ?? 0,
    carrinho: soma.geral.get("carrinho") ?? 0,
    whatsapp: cliques.filter((c) => /whatsapp/i.test(c.nome)).reduce((a, c) => a + c.n, 0),
    grupos: {
      pag: ordenar(soma.pag),
      ref: ordenar(soma.ref),
      disp: ordenar(soma.disp),
      busca: ordenar(soma.busca),
      clique: cliques,
      carrinho: ordenar(soma.carrinho),
      hora: [...soma.hora].map(([nome, n]) => ({ nome, n })).sort((a, b) => Number(a.nome) - Number(b.nome)),
      local: ordenar(soma.local),
    },
  };
}

// --- visit journeys (2026-10-05) ---------------------------------------------
// Each browser tab session gets a random id (sessionStorage, gone when the
// tab closes). Its steps are kept 30 days so the admin can read "what this
// visitor did" — still with no name, number or IP.

/** k: v page, c click, b search, a cart add, $ went to pay, p paid, i joined the list. */
export type Passo = { k: "v" | "c" | "b" | "a" | "$" | "p" | "i"; x: string; q?: string; t?: number };
const VISITA_S = 30 * 24 * 3600;
const MAX_PASSOS = 80;
export const vidValido = (v: unknown): v is string => typeof v === "string" && /^[a-z0-9]{8,24}$/.test(v);
const kv = (vid: string) => `vj:${vid}`;

function cmdsDoCaminho(vid: string, passo: Passo, ctx: { origem?: string; local?: string; disp?: string } = {}): Cmd[] {
  if (!vidValido(vid)) return [];
  const agora = Date.now();
  const cmds: Cmd[] = [
    ["HSETNX", kv(vid), "inicio", agora],
    ["HSET", kv(vid), "fim", agora],
    ["HINCRBY", kv(vid), "n", 1],
    ["RPUSH", `${kv(vid)}:p`, JSON.stringify({ ...passo, t: agora })],
    ["LTRIM", `${kv(vid)}:p`, 0, MAX_PASSOS - 1],
    ["ZADD", "vj", agora, vid],
    ["EXPIRE", kv(vid), VISITA_S],
    ["EXPIRE", `${kv(vid)}:p`, VISITA_S],
  ];
  for (const [campo, valor] of Object.entries(ctx)) if (valor) cmds.push(["HSETNX", kv(vid), campo, valor]);
  const marca = { a: "carrinho", $: "pagar", p: "pagou", i: "lista" }[passo.k as "a" | "$" | "p" | "i"];
  if (marca) cmds.push(["HSET", kv(vid), marca, 1]);
  if (passo.k === "c" && /whatsapp/i.test(passo.x)) cmds.push(["HSET", kv(vid), "whatsapp", 1]);
  return cmds;
}

/** Adds one step from server code (checkout, payment, list sign-up). Never throws. */
export async function anotarNoCaminho(vid: unknown, passo: Passo) {
  if (!estatisticasAtivas() || !vidValido(vid)) return;
  try {
    await pipeline(cmdsDoCaminho(vid, passo));
  } catch (err) {
    console.error("anotarNoCaminho", err);
  }
}

export type Visita = {
  id: string;
  inicio: number;
  fim: number;
  n: number;
  origem?: string;
  local?: string;
  disp?: string;
  carrinho?: boolean;
  whatsapp?: boolean;
  pagar?: boolean;
  pagou?: boolean;
  lista?: boolean;
  passos: Passo[];
};

function montarVisita(id: string, arr: string[] | null, brutos: string[] | null): Visita | null {
  if (!arr?.length) return null;
  const h: Record<string, string> = {};
  for (let j = 0; j + 1 < arr.length; j += 2) h[arr[j]] = arr[j + 1];
  const passos = (brutos ?? []).flatMap((s) => {
    try {
      return [JSON.parse(s) as Passo];
    } catch {
      return [];
    }
  });
  return {
    id,
    inicio: Number(h.inicio),
    fim: Number(h.fim),
    n: Number(h.n) || passos.length,
    origem: h.origem,
    local: h.local,
    disp: h.disp,
    carrinho: h.carrinho === "1",
    whatsapp: h.whatsapp === "1",
    pagar: h.pagar === "1",
    pagou: h.pagou === "1",
    lista: h.lista === "1",
    passos,
  };
}

/** The most recent visits (newest first); drops ids whose data expired. */
export async function visitasRecentes(limite = 60): Promise<Visita[]> {
  const [ids] = (await pipeline([["ZREVRANGE", "vj", 0, limite - 1]])) as string[][];
  if (!ids?.length) return [];
  const r = await pipeline(ids.flatMap((id): Cmd[] => [["HGETALL", kv(id)], ["LRANGE", `${kv(id)}:p`, 0, -1]]));
  const mortas: string[] = [];
  const lista: Visita[] = [];
  ids.forEach((id, i) => {
    const v = montarVisita(id, r[i * 2] as string[] | null, r[i * 2 + 1] as string[] | null);
    if (v) lista.push(v);
    else mortas.push(id);
  });
  // Keep the index small: forget expired visits and anything past the newest 2000.
  const limpeza: Cmd[] = [["ZREMRANGEBYRANK", "vj", 0, -2001]];
  if (mortas.length) limpeza.push(["ZREM", "vj", ...mortas]);
  pipeline(limpeza).catch(() => {});
  return lista;
}

/** One visit by id (for a "see the visit" link from an order). */
export async function visita(id: string): Promise<Visita | null> {
  if (!vidValido(id)) return null;
  const r = await pipeline([["HGETALL", kv(id)], ["LRANGE", `${kv(id)}:p`, 0, -1]]);
  return montarVisita(id, r[0] as string[] | null, r[1] as string[] | null);
}
