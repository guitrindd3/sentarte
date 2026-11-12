// Christmas on the site (user 2026-11-12, after approving the preview: "pode
// colocar no site real... que entre depois da black friday, no dia 1 de
// dezembro"). Every year from 1 to 25 December (Brasília): the decorations
// (components/natal.tsx) show and the typed coupon NATALNASENTARTE10 (10% on
// chairs) works — a virtual coupon like BLACKFRIDAY, not in the admin's
// `cupons` hash (lib/cupons-store.ts buscarCupom). The biggest coupon wins as
// always (so the automatic 7% doesn't stack on it); Pix 2% still stacks.
// Shared by server and browser: pure date math only.

import type { CupomPublico } from "./cupom";

export const CODIGO_NATAL = "NATALNASENTARTE10";
export const PERCENTUAL_NATAL = 10;
/** MM-DD, both inclusive. Black Friday week always ends before 1 December. */
export const NATAL_DE = "12-01";
export const NATAL_ATE = "12-25";

/** `hoje` = YYYY-MM-DD in Brasília. */
export const naEpocaDeNatal = (hoje: string) => hoje.slice(5) >= NATAL_DE && hoje.slice(5) <= NATAL_ATE;

export const cupomNatal = (): CupomPublico => ({ codigo: CODIGO_NATAL, tipo: "percentual", valor: PERCENTUAL_NATAL, minCadeiras: 1, automatico: false });

/** Chair price with the Christmas coupon. */
export const precoNatal = (preco: number) => Math.round(preco * (1 - PERCENTUAL_NATAL / 100) * 100) / 100;
