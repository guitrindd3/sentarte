import "server-only";
import { redis } from "./redis";

// Customer reviews sent from the site (2026-10-05): they wait in Redis until
// the atelier approves them in /admin → Depoimentos (then they become a
// Depoimento in the site content, with stars). Nothing shows on the site
// without approval.

export type AvaliacaoPendente = { id: string; em: number; nome: string; cidade?: string; texto: string; estrelas: number; vid?: string };

const K = "avaliacoes:pendentes";

export async function guardarAvaliacao(a: Omit<AvaliacaoPendente, "id" | "em">) {
  const id = `av-${crypto.randomUUID().slice(0, 8)}`;
  await redis([["HSET", K, id, JSON.stringify({ ...a, id, em: Date.now() })]]);
  return id;
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
  await redis([["HDEL", K, id]]);
}

/** Abuse brake: 3 reviews per IP per day. */
export async function limiteDeAvaliacao(ip: string) {
  const k = `avaliacoes:ip:${ip}`;
  const [n] = await redis([["INCR", k]]);
  if (Number(n) === 1) await redis([["EXPIRE", k, 86400]]);
  return Number(n) > 3;
}
