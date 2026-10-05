import "server-only";
import { createHash } from "crypto";

// Site statistics (2026-10-05): the admin's "Acessos" dashboard. Vercel Web
// Analytics on Hobby can't record searches or clicks, so the site counts them
// itself in a free Upstash Redis (Vercel Marketplace, plan "free", auto-upgrade
// OFF so it can never bill). Anonymous: no cookie, no IP stored — a visitor is
// a one-day hash of IP + browser, only used inside a HyperLogLog to count
// unique visitors. Everything is a per-day counter that expires after ~13 months.

const URL_ = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const VALIDADE_S = 400 * 24 * 3600;

export const estatisticasAtivas = () => Boolean(URL_ && TOKEN);

type Cmd = (string | number)[];

async function pipeline(cmds: Cmd[]): Promise<unknown[]> {
  if (!URL_ || !TOKEN || cmds.length === 0) return [];
  const res = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  return out.map((r) => r.result);
}

/** YYYY-MM-DD in Brasília time. */
export function diaBR(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
}
function horaBR(d = new Date()) {
  return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(d));
}

export const GRUPOS = ["geral", "pag", "ref", "disp", "busca", "clique", "carrinho", "hora", "local"] as const;
type Grupo = (typeof GRUPOS)[number];
const chave = (dia: string, g: Grupo | "vis") => `e:${dia}:${g}`;

export type Evento =
  | { t: "v"; p: string; r?: string; q?: string }
  | { t: "c"; l: string }
  | { t: "b"; q: string; onde?: string }
  | { t: "a"; m: string };

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

  if (ev.t === "v") {
    const p = limpar(ev.p, 80) || "/";
    inc("geral", "views");
    inc("pag", p);
    inc("hora", String(horaBR(agora)));
    const ua = h.get("user-agent") ?? "";
    inc("disp", dispositivo(ua));
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
      inc("ref", o);
      // Count the visitor's town once per arrival from outside, not per page.
      const cidade = decodeURIComponent(h.get("x-vercel-ip-city") ?? "");
      const uf = h.get("x-vercel-ip-country-region") ?? "";
      const pais = h.get("x-vercel-ip-country") ?? "";
      if (cidade) inc("local", pais && pais !== "BR" ? `${cidade} (${pais})` : uf ? `${cidade} - ${uf}` : cidade);
    }
    if (ev.q) inc("busca", limpar(ev.q, 40).toLowerCase());
  } else if (ev.t === "c") {
    const l = limpar(ev.l);
    if (!l) return;
    inc("clique", l);
  } else if (ev.t === "b") {
    const q = limpar(ev.q, 40).toLowerCase();
    if (q.length < 2) return;
    inc("busca", ev.onde === "trama" ? `${q} (Monte a sua trama)` : q);
  } else if (ev.t === "a") {
    const m = limpar(ev.m);
    if (!m) return;
    inc("carrinho", m);
    inc("geral", "carrinho");
  }
  for (const k of toca) cmds.push(["EXPIRE", k, VALIDADE_S]);
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
