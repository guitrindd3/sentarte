// Black Friday week (user 2026-10-20: "queria ter algo de black friday").
// Every year, from the Monday before Black Friday (the day after the 4th
// Thursday of November) to the Sunday after. During it an automatic coupon
// BLACKFRIDAY joins the others (lib/cupons-store.ts cuponsAutomaticos), the
// top strip switches to a countdown, and chair prices show struck through.
// Percent / minimum / on-off are set in the admin's Cupons page (Redis
// `blackfriday`). Shared by server and browser: pure date math only.

import type { CupomPublico } from "./cupom";

export const CODIGO_BLACK_FRIDAY = "BLACKFRIDAY";

export type ConfigBlackFriday = { ligado: boolean; percentual: number; minCadeiras: number };
export const BLACK_FRIDAY_PADRAO: ConfigBlackFriday = { ligado: true, percentual: 12, minCadeiras: 1 };

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Black Friday of that year (UTC midnight of the day). */
export function diaDaBlackFriday(ano: number) {
  const primeiro = new Date(Date.UTC(ano, 10, 1));
  const primeiraQuinta = 1 + ((4 - primeiro.getUTCDay() + 7) % 7);
  return new Date(Date.UTC(ano, 10, primeiraQuinta + 21 + 1));
}

/** Monday..Sunday around it (YYYY-MM-DD, inclusive) and the end instant (Sunday 23:59:59 Brasília). */
export function semanaDaBlackFriday(ano: number) {
  const bf = diaDaBlackFriday(ano).getTime();
  const dia = 86_400_000;
  return {
    inicio: iso(new Date(bf - 4 * dia)),
    fim: iso(new Date(bf + 2 * dia)),
    dia: iso(new Date(bf)),
    // Monday 03:00 UTC = 00:00 in Brasília (UTC−3, no daylight saving)
    fimMs: bf + 3 * dia + 3 * 3_600_000 - 1000,
  };
}

/** The week if `hoje` (YYYY-MM-DD, Brasília) is inside it. */
export function naBlackFriday(hoje: string) {
  const s = semanaDaBlackFriday(Number(hoje.slice(0, 4)));
  return hoje >= s.inicio && hoje <= s.fim ? s : null;
}

export function cupomBlackFriday(c: ConfigBlackFriday): CupomPublico {
  return { codigo: CODIGO_BLACK_FRIDAY, tipo: "percentual", valor: c.percentual, minCadeiras: c.minCadeiras, automatico: true };
}

/** Today in Brasília (YYYY-MM-DD). */
export const hojeBR = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
