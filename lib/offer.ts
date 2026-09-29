// Commercial terms shown across the site (price, installments, shipping,
// production time, multi-chair coupon). Supplied by the user 2026-09-29 —
// not admin-editable yet, so change them here. Only the "cadeiras" category
// has a price; other categories show no price.

export const PRECO_CADEIRA = 449.9;
// Any chair with a name (or other personalization) woven in — user 2026-09-29.
export const PRECO_CADEIRA_COM_NOME = 489.9;
export const PARCELAS_MAX = 4; // no cartão, com a taxa da maquininha (não é "sem juros")
export const PIX_DESCONTO = 0.02; // user 2026-09-29; stacks with the coupon (applied on the final total)
export const PRAZO_PRODUCAO_DIAS_UTEIS = 5;
export const CUPOM_CODIGO = "SENTARTE";
export const CUPOM_DESCONTO = 0.05;
export const CUPOM_MIN_ITENS = 2;

export const CATEGORIA_COM_PRECO = "cadeiras";

// Categories kept in the admin/Blob content but not offered on the site yet
// (user 2026-09-29: "espreguiçadeiras ainda não e bolsas ainda não"). Remove
// a slug from here to bring that category back everywhere at once.
export const CATEGORIAS_OCULTAS = new Set(["bolsas", "espreguicadeiras"]);

export function precoCadeira(comNome: boolean) {
  return comNome ? PRECO_CADEIRA_COM_NOME : PRECO_CADEIRA;
}

/** Price of one cart line: personalized if it has a name or is a desenho design. */
export function precoItemCadeira(item: { nomePersonalizado?: string; personalizada?: boolean }) {
  return precoCadeira(Boolean(item.nomePersonalizado) || Boolean(item.personalizada));
}

export function precoPix(valor: number) {
  return Math.round(valor * (1 - PIX_DESCONTO) * 100) / 100;
}

export function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
