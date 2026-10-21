import "server-only";
import { redis } from "./redis";

// "Acompanhe a sua sendo trançada" (user 2026-10-21): photos the atelier
// takes of a customer's chair while it's being made, shown on the order's
// /acompanhar/<ref> page. Redis, like the orders (instant, no deploy):
// `pedido:<ref>:producao` hash id → {em, legenda}, and the JPEG data URL apart
// in `pedido:<ref>:producao:<id>` so listing doesn't pull the pictures.

export type FotoProducao = { id: string; em: number; legenda: string };

const MAX = 6;
const DIAS = 180 * 86_400;
const kLista = (ref: string) => `pedido:${ref}:producao`;
const kFoto = (ref: string, id: string) => `pedido:${ref}:producao:${id}`;

export const idFotoValido = (id: string) => /^[a-z0-9]{8,16}$/.test(id);
export const refValida = (ref: string) => /^[a-z0-9-]{6,40}$/i.test(ref);

export async function fotosDaProducao(ref: string): Promise<FotoProducao[]> {
  if (!refValida(ref)) return [];
  const [bruto] = (await redis([["HGETALL", kLista(ref)]])) as string[][];
  const lista: FotoProducao[] = [];
  for (let i = 0; i + 1 < (bruto ?? []).length; i += 2) {
    try {
      const m = JSON.parse(bruto[i + 1]) as Omit<FotoProducao, "id">;
      lista.push({ id: bruto[i], em: m.em, legenda: m.legenda });
    } catch {}
  }
  return lista.sort((a, b) => a.em - b.em);
}

export async function fotoDaProducao(ref: string, id: string): Promise<string | null> {
  if (!refValida(ref) || !idFotoValido(id)) return null;
  const [v] = (await redis([["GET", kFoto(ref, id)]])) as (string | null)[];
  return v;
}

export async function adicionarFotoProducao(ref: string, legenda: string, dataUrl: string) {
  const atuais = await fotosDaProducao(ref);
  if (atuais.length >= MAX) throw new Error(`no máximo ${MAX}`);
  const id = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
  await redis([
    ["SET", kFoto(ref, id), dataUrl, "EX", DIAS],
    ["HSET", kLista(ref), id, JSON.stringify({ em: Date.now(), legenda })],
    ["EXPIRE", kLista(ref), DIAS],
  ]);
}

export async function tirarFotoProducao(ref: string, id: string) {
  if (!refValida(ref) || !idFotoValido(id)) return;
  await redis([["HDEL", kLista(ref), id], ["DEL", kFoto(ref, id)]]);
}

export const MAX_FOTOS_PRODUCAO = MAX;
