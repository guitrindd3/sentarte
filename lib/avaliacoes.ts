import "server-only";
import { redis } from "./redis";

// Customer reviews sent from the site (2026-10-05): they wait in Redis until
// the atelier approves them in /admin → Depoimentos (then they become a
// Depoimento in the site content, with stars). Nothing shows on the site
// without approval.

export type AvaliacaoPendente = { id: string; em: number; nome: string; cidade?: string; texto: string; estrelas: number; vid?: string; temFoto?: boolean };

const K = "avaliacoes:pendentes";
// The customer's photo (2026-10-19, "fotos de clientes"): a small JPEG data URL
// shrunk in the browser, kept apart from the list so it stays light. It goes
// into the repo (public/catalogo) only when the review is approved.
const kFoto = (id: string) => `avaliacoes:foto:${id}`;
const FOTO_S = 90 * 24 * 3600;

export async function guardarAvaliacao(a: Omit<AvaliacaoPendente, "id" | "em" | "temFoto">, foto?: string) {
  const id = `av-${crypto.randomUUID().slice(0, 8)}`;
  await redis([
    ["HSET", K, id, JSON.stringify({ ...a, id, em: Date.now(), temFoto: Boolean(foto) || undefined })],
    ...(foto ? [["SET", kFoto(id), foto, "EX", FOTO_S]] : []),
  ]);
  return id;
}

/** The pending review's photo as a data URL, if the customer sent one. */
export async function fotoDaAvaliacao(id: string): Promise<string | null> {
  const [f] = (await redis([["GET", kFoto(id)]])) as (string | null)[];
  return f;
}

/** Checks a data URL sent by the browser: a real JPEG, at most ~1 MB. */
export function fotoValida(dataUrl: unknown): string | undefined {
  if (typeof dataUrl !== "string" || dataUrl.length > 1_400_000) return undefined;
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return undefined;
  const b = Buffer.from(m[1].slice(0, 8), "base64");
  return b[0] === 0xff && b[1] === 0xd8 ? dataUrl : undefined;
}

export async function avaliacoesPendentes(): Promise<AvaliacaoPendente[]> {
  const [bruto] = (await redis([["HGETALL", K]])) as string[][];
  const lista: AvaliacaoPendente[] = [];
  for (let i = 0; i + 1 < (bruto ?? []).length; i += 2) {
    try {
      lista.push(JSON.parse(bruto[i + 1]) as AvaliacaoPendente);
    } catch {}
  }
  return lista.sort((a, b) => b.em - a.em);
}

export async function tirarAvaliacao(id: string) {
  await redis([["HDEL", K, id], ["DEL", kFoto(id)]]);
}

/** Abuse brake: 3 reviews per IP per day. */
export async function limiteDeAvaliacao(ip: string) {
  const k = `avaliacoes:ip:${ip}`;
  const [n] = await redis([["INCR", k]]);
  if (Number(n) === 1) await redis([["EXPIRE", k, 86400]]);
  return Number(n) > 3;
}
