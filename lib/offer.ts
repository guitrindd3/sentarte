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

/** Wooden armrests instead of the plastic ones (user 2026-10-21), extra per chair type. */
export const BRACO_MADEIRA: Record<TipoCadeira, number> = { infantil: 100, normal: 120, reclinavel: 160 };
/** Example photo: the Diamante verde chair has wooden armrests. */
export const FOTO_BRACO_MADEIRA = "/catalogo/diamante-verde.jpg";

/** Tassels on the backrest (2026-10-23): R$ 10 EACH — one or two (user: "a de 1 sobe mais 10 reais, dois já está com 20"). Only in Monte a sua trama. */
export const TASSEL_PRECO = 10;

export function precoCadeira(comNome: boolean, tipo: TipoCadeira = "normal", madeira = false, tasseis = 0) {
  const t = TIPOS_CADEIRA[tipo] ?? TIPOS_CADEIRA.normal;
  return Math.round(((comNome ? t.precoComNome : t.preco) + (madeira ? BRACO_MADEIRA[tipo] ?? BRACO_MADEIRA.normal : 0) + tasseis * TASSEL_PRECO) * 100) / 100;
}

/** Price of one cart line: personalized if it has a name or is a desenho design; + wooden armrests, + tassels. */
export function precoItemCadeira(item: { nomePersonalizado?: string; personalizada?: boolean; tipoCadeira?: TipoCadeira; bracoMadeira?: boolean; tassel?: string; tasselQtd?: 1 | 2 }) {
  return precoCadeira(Boolean(item.nomePersonalizado) || Boolean(item.personalizada), item.tipoCadeira, Boolean(item.bracoMadeira), quantosTasseis(item));
}

/** How many tassels a cart line has (an item from before 1/2 existed had the pair). */
export function quantosTasseis(item: { tassel?: string; tasselQtd?: 1 | 2 }) {
  return item.tassel ? (item.tasselQtd === 1 ? 1 : 2) : 0;
}

/** "1 tassel vinho (lado direito)" / "2 tassels vinho" for the cart and the messages. */
export function rotuloTassel(item: { tassel?: string; tasselQtd?: 1 | 2; tasselLado?: "esq" | "dir" }) {
  if (!item.tassel) return "";
  const cor = item.tassel.toLowerCase();
  return item.tasselQtd === 1 ? `1 tassel ${cor} (lado ${item.tasselLado === "esq" ? "esquerdo" : "direito"})` : `2 tassels ${cor}`;
}

export function precoPix(valor: number) {
  return Math.round(valor * (1 - PIX_DESCONTO) * 100) / 100;
}

export function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
