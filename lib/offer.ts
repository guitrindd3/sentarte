// Commercial terms shown across the site (price, installments, production
// time, multi-chair coupon). Shipping is quoted by CEP — see lib/frete-servidor.ts. Supplied by the user 2026-09-29 —
// not admin-editable yet, so change them here. Only the "cadeiras" category
// has a price; other categories show no price.

export const PRECO_CADEIRA = 449.9;
// Any chair with a name (or other personalization) woven in — user 2026-09-29.
export const PRECO_CADEIRA_COM_NOME = 489.9;
export const PARCELAS_MAX = 4; // no cartão, com a taxa da maquininha (não é "sem juros")
export const PIX_DESCONTO = 0.02; // user 2026-09-29; stacks with the coupon (applied on the final total)
export const PRAZO_PRODUCAO_DIAS_UTEIS = 5;
// Coupons (SENTARTE included) are managed in the admin since 2026-10-05 —
// see lib/cupom.ts and lib/cupons-store.ts.

export const CATEGORIA_COM_PRECO = "cadeiras";

// Categories kept in the admin/Blob content but not offered on the site yet
// (user 2026-09-29: "espreguiçadeiras ainda não e bolsas ainda não"). Remove
// a slug from here to bring that category back everywhere at once.
export const CATEGORIAS_OCULTAS = new Set(["bolsas", "espreguicadeiras"]);

/**
 * Chair types offered in "Monte a sua trama" (user 2026-10-05). "normal" is the
 * fixed chair every catalog model is; the other two exist only in the builder.
 */
export type TipoCadeira = "normal" | "infantil" | "reclinavel";
export const TIPOS_CADEIRA: Record<TipoCadeira, { rotulo: string; curto: string; preco: number; precoComNome: number }> = {
  infantil: { rotulo: "Cadeira infantil", curto: "Infantil", preco: 399.9, precoComNome: 429.9 },
  normal: { rotulo: "Cadeira normal", curto: "Normal", preco: PRECO_CADEIRA, precoComNome: PRECO_CADEIRA_COM_NOME },
  reclinavel: { rotulo: "Cadeira reclinável 8 posições", curto: "Reclinável 8 posições", preco: 549.9, precoComNome: 569.9 },
};
export const tipoValido = (t: unknown): TipoCadeira | undefined => (t === "infantil" || t === "reclinavel" ? t : undefined);

export function precoCadeira(comNome: boolean, tipo: TipoCadeira = "normal") {
  const t = TIPOS_CADEIRA[tipo] ?? TIPOS_CADEIRA.normal;
  return comNome ? t.precoComNome : t.preco;
}

/** Price of one cart line: personalized if it has a name or is a desenho design. */
export function precoItemCadeira(item: { nomePersonalizado?: string; personalizada?: boolean; tipoCadeira?: TipoCadeira }) {
  return precoCadeira(Boolean(item.nomePersonalizado) || Boolean(item.personalizada), item.tipoCadeira);
}

export function precoPix(valor: number) {
  return Math.round(valor * (1 - PIX_DESCONTO) * 100) / 100;
}

export function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
