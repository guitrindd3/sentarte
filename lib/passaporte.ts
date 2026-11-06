import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { gravarPedido, lerPedido, type PedidoCliente } from "./clientes";
import { lerColecao, numerar } from "./colecoes";
import { CATEGORIA_COM_PRECO, rotuloTassel, TIPOS_CADEIRA, type TipoCadeira } from "./offer";
import { SITE_URL } from "./nav";
import { redis, redisAtivo } from "./redis";

// "Passaporte da cadeira" (2026-11-06, user picked it from the visionary
// ideas): every chair of a paid order gets a number (Cadeira nº 0217) and a
// public page, /p/<n>-<signature>, reached by a QR tag the atelier ties to the
// chair. It tells the chair's story: model, colors, the woven name, who made
// it, hours and metres of rope, the collection number (lib/colecoes.ts) and
// the production photos while the order keeps them (180 days).
// Passports never expire (orders do): `passaporte:<n>` JSON, counter
// `passaporte:seq`, zset `passaportes` (n → n) for the admin list. The
// signature keeps people from walking through every number (the woven name is
// on it).

export type Passaporte = {
  n: number;
  ref: string;
  criadoEm: number;
  modelo: string;
  categoriaSlug?: string;
  /** /catalogo/… photo or /api/cadeira?… render (Monte a sua trama). */
  imagem?: string;
  corA?: string;
  corB?: string;
  /** Name woven on it. */
  nome?: string;
  tipo: TipoCadeira;
  extras?: string[];
  colecao?: { id: string; nome: string; numero: number; total: number };
  // filled in by the atelier (blank = the defaults in /admin/passaportes)
  artesa?: string;
  horas?: number;
  metros?: number;
  /** Day it was finished (YYYY-MM-DD). */
  prontaEm?: string;
};

export type ConfigPassaporte = {
  artesa: string;
  porTipo: Partial<Record<TipoCadeira, { horas?: number; metros?: number }>>;
};

const PADRAO: ConfigPassaporte = { artesa: "", porTipo: {} };
const kp = (n: number) => `passaporte:${n}`;

// --- link --------------------------------------------------------------------------

const assinatura = (n: number) => createHmac("sha256", `passaporte|${process.env.SESSION_SECRET ?? ""}`).update(String(n)).digest("hex").slice(0, 6);

export const codigoDoPassaporte = (n: number) => `${n}-${assinatura(n)}`;
export const linkDoPassaporte = (n: number) => `${SITE_URL}/p/${codigoDoPassaporte(n)}`;
export const numeroBonito = (n: number) => String(n).padStart(4, "0");

/** The number in a /p/<codigo> link, if the signature matches. */
export function numeroDoCodigo(codigo: string): number | null {
  const m = /^(\d{1,7})-([0-9a-f]{6})$/.exec(codigo);
  if (!m) return null;
  const n = Number(m[1]);
  const a = Buffer.from(assinatura(n));
  const b = Buffer.from(m[2]);
  return a.length === b.length && timingSafeEqual(a, b) ? n : null;
}

// --- storage ------------------------------------------------------------------------

export async function lerPassaporte(n: number): Promise<Passaporte | null> {
  const [b] = (await redis([["GET", kp(n)]])) as (string | null)[];
  try {
    return b ? (JSON.parse(b) as Passaporte) : null;
  } catch {
    return null;
  }
}

export async function lerPassaportes(ns: number[]): Promise<Passaporte[]> {
  if (!ns.length) return [];
  const [bs] = (await redis([["MGET", ...ns.map(kp)]])) as (string | null)[][];
  return (bs ?? []).flatMap((b) => {
    try {
      return b ? [JSON.parse(b) as Passaporte] : [];
    } catch {
      return [];
    }
  });
}

export async function gravarPassaporte(p: Passaporte) {
  await redis([["SET", kp(p.n), JSON.stringify(p)]]);
}

export async function passaportesRecentes(limite = 60): Promise<Passaporte[]> {
  const [ns] = (await redis([["ZREVRANGE", "passaportes", 0, limite - 1]])) as string[][];
  return lerPassaportes((ns ?? []).map(Number));
}

export async function lerConfigPassaporte(): Promise<ConfigPassaporte> {
  const [b] = (await redis([["GET", "passaporte:config"]])) as (string | null)[];
  try {
    if (b) return { ...PADRAO, ...(JSON.parse(b) as Partial<ConfigPassaporte>) };
  } catch {}
  return PADRAO;
}

export async function salvarConfigPassaporte(c: ConfigPassaporte) {
  await redis([["SET", "passaporte:config", JSON.stringify(c)]]);
}

/** What the page shows: the passport's own values, else the defaults by chair type. */
export function comPadroes(p: Passaporte, cfg: ConfigPassaporte) {
  const t = cfg.porTipo[p.tipo] ?? {};
  return { artesa: p.artesa?.trim() || cfg.artesa.trim() || "", horas: p.horas ?? t.horas, metros: p.metros ?? t.metros };
}

// --- creating them ------------------------------------------------------------------

type Unidade = Omit<Passaporte, "n" | "ref" | "criadoEm">;

/** One entry per chair of the order (quantity 3 = three passports). */
function unidadesDoPedido(p: PedidoCliente): Unidade[] {
  const cadeiras = (p.carrinho ?? []).filter((i) => i.categoriaSlug === CATEGORIA_COM_PRECO);
  if (cadeiras.length) {
    return cadeiras.flatMap((i) => {
      const extras = [i.bracoMadeira ? "Braço de madeira" : "", i.tassel ? rotuloTassel(i) : ""].filter(Boolean);
      const u: Unidade = {
        modelo: i.modeloNome,
        categoriaSlug: i.categoriaSlug,
        imagem: i.imagemUrl,
        corA: i.corA,
        corB: i.corB,
        nome: i.nomePersonalizado?.trim() || undefined,
        tipo: i.tipoCadeira ?? "normal",
        extras: extras.length ? extras : undefined,
      };
      return Array.from({ length: Math.max(1, Math.min(20, i.quantidade)) }, () => ({ ...u }));
    });
  }
  // older orders and sales typed in the admin have no cart: one plain entry per chair
  // (the atelier can fix the model/name on the order page)
  const porTipo = p.porTipo ?? { normal: 0, infantil: 0, reclinavel: 0 };
  return (Object.keys(porTipo) as TipoCadeira[]).flatMap((tipo) =>
    Array.from({ length: Math.min(20, porTipo[tipo]) }, () => ({ modelo: "Cadeira de praia trançada à mão", tipo }))
  );
}

/**
 * Gives every chair of a paid order its passport (once per order) and, for
 * chairs of a numbered collection, their edition numbers. Never throws.
 */
export async function gerarPassaportes(ref: string, forcar = false): Promise<number[]> {
  if (!redisAtivo()) return [];
  try {
    const p = await lerPedido(ref);
    if (!p || p.status !== "pago" || p.passaportes?.length) return p?.passaportes ?? [];
    // the admin button (older orders, or a run that broke halfway)
    if (forcar) await redis([["DEL", `pedido:${ref}:passaportes`]]);
    const [vez] = await redis([["SET", `pedido:${ref}:passaportes`, 1, "NX", "EX", 180 * 86400]]);
    if (vez !== "OK") return [];
    const unidades = unidadesDoPedido(p);
    if (!unidades.length) return [];

    // collection numbers, in the order's own collection lines (checked at checkout)
    for (const linha of p.colecoes ?? []) {
      const alvo = unidades.filter((u) => u.modelo === linha.modeloNome && !u.colecao).slice(0, linha.qtd);
      if (!alvo.length) continue;
      const numeros = await numerar(linha.id, alvo.length);
      const total = (await lerColecao(linha.id))?.total ?? 0;
      alvo.forEach((u, k) => (u.colecao = { id: linha.id, nome: linha.nome, numero: numeros[k], total }));
    }

    const [ate] = await redis([["INCRBY", "passaporte:seq", unidades.length]]);
    const primeiro = Number(ate) - unidades.length + 1;
    const agora = Date.now();
    const lista: Passaporte[] = unidades.map((u, k) => ({ ...u, n: primeiro + k, ref, criadoEm: agora }));
    await redis([...lista.map((x) => ["SET", kp(x.n), JSON.stringify(x)]), ["ZADD", "passaportes", ...lista.flatMap((x) => [x.n, x.n])]]);

    // re-read: an admin change may have landed meanwhile
    const atual = (await lerPedido(ref)) ?? p;
    atual.passaportes = lista.map((x) => x.n);
    await gravarPedido(atual);
    return atual.passaportes;
  } catch (err) {
    console.error("gerarPassaportes", ref, err);
    return [];
  }
}

/** "Normal", "Infantil"… for the page. */
export const rotuloTipo = (t: TipoCadeira) => TIPOS_CADEIRA[t].curto;
