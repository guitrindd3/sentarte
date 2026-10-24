import "server-only";
import { redis, type Cmd } from "./redis";

// Quote requests from /eventos (2026-10-24, user: "a pessoa possa mandar foto,
// imagem ou ideia da logo dele"). The customer doesn't buy on the site: the
// atelier draws a sketch, sends it on WhatsApp, gets paid there and then types
// the sale in the admin ("Lançar venda", lib/clientes.ts registrarVendaDoPainel).
// Redis like the orders: `orcamento:<id>` JSON, each picture apart in
// `orcamento:<id>:foto:<n>` (JPEG data URL), index zset `orcamentos`, 180 days.

export type StatusOrcamento = "novo" | "respondido" | "vendido";

export type Orcamento = {
  id: string;
  em: number;
  /** Short number the customer's WhatsApp message carries, e.g. "K7Q2". */
  codigo: string;
  tipo: string;
  contato: string;
  whatsapp?: string;
  nomeEvento?: string;
  data?: string;
  cidade?: string;
  qtd: { normal: number; infantil: number; reclinavel: number };
  nomes?: string;
  cores?: string;
  ideia?: string;
  fotos: number;
  status: StatusOrcamento;
  /** Order typed in the admin from this quote. */
  pedido?: string;
};

export const MAX_FOTOS_ORCAMENTO = 3;
const DIAS = 180 * 86_400;
const k = (id: string) => `orcamento:${id}`;
const kFoto = (id: string, n: number) => `orcamento:${id}:foto:${n}`;

export const idOrcamentoValido = (id: string) => /^[a-z0-9]{10,16}$/.test(id);

/** JPEG data URL from the browser (shrunk there to ≤1600px), ≤1 MB so 3 fit in one request. */
export function imagemDoOrcamento(dataUrl: unknown): string | undefined {
  if (typeof dataUrl !== "string" || dataUrl.length > 1_000_000) return undefined;
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return undefined;
  const b = Buffer.from(m[1].slice(0, 8), "base64");
  return b[0] === 0xff && b[1] === 0xd8 ? dataUrl : undefined;
}

const aleatorio = (n: number, alfabeto: string) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => alfabeto[b % alfabeto.length]).join("");

export async function salvarOrcamento(o: Omit<Orcamento, "id" | "em" | "codigo" | "fotos" | "status">, fotos: string[]) {
  const id = aleatorio(12, "abcdefghijklmnopqrstuvwxyz0123456789");
  const codigo = aleatorio(4, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789");
  const em = Date.now();
  const dados: Orcamento = { ...o, id, em, codigo, fotos: fotos.length, status: "novo" };
  // One request per picture: each can be ~1 MB.
  for (const [n, f] of fotos.entries()) await redis([["SET", kFoto(id, n), f, "EX", DIAS]]);
  await redis([
    ["SET", k(id), JSON.stringify(dados), "EX", DIAS],
    ["ZADD", "orcamentos", em, id],
    ["ZREMRANGEBYRANK", "orcamentos", 0, -301],
  ]);
  return dados;
}

export async function lerOrcamento(id: string): Promise<Orcamento | null> {
  if (!idOrcamentoValido(id)) return null;
  const [bruto] = (await redis([["GET", k(id)]])) as (string | null)[];
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as Orcamento;
  } catch {
    return null;
  }
}

export async function orcamentosRecentes(limite = 100): Promise<Orcamento[]> {
  const [ids] = (await redis([["ZREVRANGE", "orcamentos", 0, limite - 1]])) as string[][];
  if (!ids?.length) return [];
  const brutos = (await redis(ids.map((id): Cmd => ["GET", k(id)]))) as (string | null)[];
  return brutos.flatMap((b) => {
    if (!b) return [];
    try {
      return [JSON.parse(b) as Orcamento];
    } catch {
      return [];
    }
  });
}

export async function fotoDoOrcamento(id: string, n: number): Promise<string | null> {
  if (!idOrcamentoValido(id) || !(n >= 0 && n < MAX_FOTOS_ORCAMENTO)) return null;
  const [v] = (await redis([["GET", kFoto(id, n)]])) as (string | null)[];
  return v;
}

export async function gravarOrcamento(o: Orcamento) {
  await redis([["SET", k(o.id), JSON.stringify(o), "KEEPTTL"]]);
}

export async function excluirOrcamento(id: string) {
  if (!idOrcamentoValido(id)) return;
  await redis([
    ["DEL", k(id)],
    ...Array.from({ length: MAX_FOTOS_ORCAMENTO }, (_, n): Cmd => ["DEL", kFoto(id, n)]),
    ["ZREM", "orcamentos", id],
  ]);
}

/** Abuse brake for the public form: 6 quotes per IP per hour. */
export async function limiteDeOrcamento(ip: string) {
  const chave = `orcamentos:ip:${ip}`;
  const [n] = await redis([["INCR", chave]]);
  if (Number(n) === 1) await redis([["EXPIRE", chave, 3600]]);
  return Number(n) > 6;
}
