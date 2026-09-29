// Commercial terms shown across the site (price, installments, shipping,
// production time, multi-chair coupon). Supplied by the user 2026-09-29 —
// not admin-editable yet, so change them here. Only the "cadeiras" category
// has a price; other categories show no price.

export const PRECO_CADEIRA = 449.9;
export const PARCELAS_MAX = 4; // no cartão, com a taxa da maquininha (não é "sem juros")
export const PRAZO_PRODUCAO_DIAS_UTEIS = 5;
export const CUPOM_CODIGO = "SENTARTE";
export const CUPOM_DESCONTO = 0.05;
export const CUPOM_MIN_ITENS = 2;

export const CATEGORIA_COM_PRECO = "cadeiras";

// Categories kept in the admin/Blob content but not offered on the site yet
// (user 2026-09-29: "espreguiçadeiras ainda não e bolsas ainda não"). Remove
// a slug from here to bring that category back everywhere at once.
export const CATEGORIAS_OCULTAS = new Set(["bolsas", "espreguicadeiras"]);

export function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
