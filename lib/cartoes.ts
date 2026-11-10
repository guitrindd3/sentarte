import "server-only";
import { normalizarCartao, type Cartao } from "./cartoes-modelo";
import { redis } from "./redis";

// The atelier's own card models (/admin/cartoes), one JSON list in Redis.

const K = "cartoes:modelos";
export const MAX_CARTOES = 40;

export async function lerCartoes(): Promise<Cartao[]> {
  const [v] = (await redis([["GET", K]])) as (string | null)[];
  if (!v) return [];
  try {
    const lista = JSON.parse(v) as unknown[];
    return lista.map(normalizarCartao).filter((c): c is Cartao => c !== null);
  } catch {
    return [];
  }
}

export async function gravarCartoes(lista: Cartao[]) {
  await redis([["SET", K, JSON.stringify(lista.slice(0, MAX_CARTOES))]]);
}
