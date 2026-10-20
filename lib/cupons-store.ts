import "server-only";
import { unstable_cache } from "next/cache";
import { CUPOM_PADRAO, normalizarCodigo, type Cupom, type CupomPublico } from "./cupom";
import { diaBR } from "./estatisticas";
import { redis, redisAtivo } from "./redis";
import { BLACK_FRIDAY_PADRAO, CODIGO_BLACK_FRIDAY, cupomBlackFriday, naBlackFriday, type ConfigBlackFriday } from "./black-friday";

// Coupons live in Redis (hash `cupons`, by code) so the admin's changes work
// instantly, without a deploy. Paid uses are counted in `cupons:usos`.
// The first read seeds SENTARTE (5% from 2 chairs, automatic) — the terms
// that were hard-coded in lib/offer.ts before 2026-10-05.

const K = { cupons: "cupons", usos: "cupons:usos", semeado: "cupons:semeado", blackFriday: "blackfriday" };

/** Black Friday settings (lib/black-friday.ts); the default until the admin saves. */
export async function configBlackFriday(): Promise<ConfigBlackFriday> {
  if (!redisAtivo()) return { ...BLACK_FRIDAY_PADRAO, ligado: false };
  try {
    const [bruto] = (await redis([["GET", K.blackFriday]])) as (string | null)[];
    return bruto ? { ...BLACK_FRIDAY_PADRAO, ...(JSON.parse(bruto) as Partial<ConfigBlackFriday>) } : BLACK_FRIDAY_PADRAO;
  } catch (err) {
    console.error("configBlackFriday", err);
    return { ...BLACK_FRIDAY_PADRAO, ligado: false };
  }
}

/** Paid uses of a code (also BLACKFRIDAY, which isn't in the `cupons` hash). */
export async function usosDoCupom(codigo: string) {
  const [n] = (await redis([["HGET", K.usos, codigo]])) as (string | null)[];
  return Number(n) || 0;
}

export async function salvarConfigBlackFriday(c: ConfigBlackFriday) {
  await redis([["SET", K.blackFriday, JSON.stringify(c)]]);
}

/** For pre-rendered pages (top strip): cached like cuponsDaVitrine. */
export const configBlackFridayDaVitrine = unstable_cache(configBlackFriday, ["blackfriday-vitrine"], { revalidate: 600, tags: ["cupons"] });

/** The BLACKFRIDAY coupon when it's on and today is in Black Friday week. */
async function cupomBlackFridayDeHoje(): Promise<CupomPublico | null> {
  const c = await configBlackFriday();
  return c.ligado && naBlackFriday(diaBR()) ? cupomBlackFriday(c) : null;
}

export type CupomComUsos = Cupom & { usos: number };

async function semearSePreciso() {
  const [ja] = await redis([["GET", K.semeado]]);
  if (ja) return;
  const c: Cupom = { ...CUPOM_PADRAO, ativo: true, criadoEm: Date.now(), descricao: "Desconto para quem leva 2 ou mais cadeiras" };
  await redis([
    ["HSETNX", K.cupons, c.codigo, JSON.stringify(c)],
    ["SET", K.semeado, 1],
  ]);
}

export async function listarCupons(): Promise<CupomComUsos[]> {
  await semearSePreciso();
  const [bruto, usos] = (await redis([["HGETALL", K.cupons], ["HGETALL", K.usos]])) as string[][];
  const mapaUsos = new Map<string, number>();
  for (let i = 0; i + 1 < (usos ?? []).length; i += 2) mapaUsos.set(usos[i], Number(usos[i + 1]) || 0);
  const lista: CupomComUsos[] = [];
  for (let i = 0; i + 1 < (bruto ?? []).length; i += 2) {
    try {
      const c = JSON.parse(bruto[i + 1]) as Cupom;
      lista.push({ ...c, usos: mapaUsos.get(c.codigo) ?? 0 });
    } catch {}
  }
  return lista.sort((a, b) => b.criadoEm - a.criadoEm);
}

/** Why a coupon can't be used right now, or null if it can. */
export function motivoInvalido(c: CupomComUsos) {
  if (!c.ativo) return "desligado";
  if (c.validoAte && diaBR() > c.validoAte) return "vencido";
  if (c.limiteUsos && c.usos >= c.limiteUsos) return "esgotado";
  return null;
}

const publico = (c: Cupom): CupomPublico => ({
  codigo: c.codigo,
  tipo: c.tipo,
  valor: c.valor,
  minCadeiras: c.minCadeiras,
  automatico: c.automatico,
  ...(c.vale ? { vale: true } : {}),
});

/** Coupons offered to everyone right now: the automatic ones that are valid. */
export async function cuponsAutomaticos(): Promise<CupomPublico[]> {
  if (!redisAtivo()) return [CUPOM_PADRAO];
  try {
    const lista = (await listarCupons()).filter((c) => c.automatico && !motivoInvalido(c)).map(publico);
    const bf = await cupomBlackFridayDeHoje();
    return bf ? [...lista.filter((c) => c.codigo !== CODIGO_BLACK_FRIDAY), bf] : lista;
  } catch (err) {
    console.error("cuponsAutomaticos", err);
    return [];
  }
}

/**
 * The same list for page rendering (offer strip, FAQ): cached 10 min under the
 * "cupons" tag so pages can be pre-rendered (2026-10-06 speed pass). The
 * coupon admin actions call updateTag("cupons"). Cart/checkout stay live.
 */
export const cuponsDaVitrine = unstable_cache(cuponsAutomaticos, ["cupons-vitrine"], { revalidate: 600, tags: ["cupons"] });

/** A typed code, if it exists and is usable now. */
export async function buscarCupom(codigo: string): Promise<{ cupom?: CupomPublico; erro?: string }> {
  const cod = normalizarCodigo(codigo);
  if (!cod) return { erro: "Digite o código do cupom." };
  if (!redisAtivo()) return cod === CUPOM_PADRAO.codigo ? { cupom: CUPOM_PADRAO } : { erro: "Cupom não encontrado." };
  if (cod === CODIGO_BLACK_FRIDAY) {
    const bf = await cupomBlackFridayDeHoje();
    if (bf) return { cupom: bf };
  }
  const c = (await listarCupons()).find((x) => x.codigo === cod);
  if (!c) return { erro: cod === CODIGO_BLACK_FRIDAY ? "A Black Friday não está valendo agora." : "Cupom não encontrado." };
  const motivo = motivoInvalido(c);
  if (motivo === "vencido") return { erro: "Esse cupom já venceu." };
  if (motivo === "esgotado") return { erro: "Esse cupom já foi usado o máximo de vezes." };
  if (motivo) return { erro: "Esse cupom não está valendo agora." };
  return { cupom: publico(c) };
}

/** The coupons that apply to an order: valid automatic ones + the typed one (if valid). */
export async function cuponsDoPedido(digitado?: string) {
  const lista = await cuponsAutomaticos();
  if (digitado) {
    const r = await buscarCupom(digitado);
    if (r.cupom && !lista.some((c) => c.codigo === r.cupom!.codigo)) lista.push(r.cupom);
  }
  return lista;
}

/** Vale-presente codes bought on the site (one use each, see lib/vale.ts). */
export async function criarCuponsDeVale(vales: { codigo: string; valor: number; descricao: string; validoAte: string }[]) {
  if (!vales.length) return;
  await redis(
    vales.map((v) => {
      const c: Cupom = {
        codigo: v.codigo,
        tipo: "valor",
        valor: v.valor,
        minCadeiras: 1,
        automatico: false,
        vale: true,
        ativo: true,
        validoAte: v.validoAte,
        limiteUsos: 1,
        descricao: v.descricao,
        criadoEm: Date.now(),
      };
      return ["HSETNX", K.cupons, c.codigo, JSON.stringify(c)];
    })
  );
}

export async function salvarCupom(c: Cupom) {
  await redis([["HSET", K.cupons, c.codigo, JSON.stringify(c)], ["SET", K.semeado, 1]]);
}

export async function excluirCupom(codigo: string) {
  await redis([["HDEL", K.cupons, codigo], ["HDEL", K.usos, codigo]]);
}

export async function contarUsoDoCupom(codigo: string) {
  if (!redisAtivo() || !codigo) return;
  try {
    await redis([["HINCRBY", K.usos, codigo, 1]]);
  } catch (err) {
    console.error("contarUsoDoCupom", err);
  }
}
