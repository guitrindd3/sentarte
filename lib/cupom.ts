// Discount coupons (2026-10-05): created in the admin ("Cupons"), stored in
// Redis (lib/cupons-store.ts). This file is the shared math, used by the cart
// (display) and by /api/checkout (the amount actually charged).

/** What the browser may know about a coupon. */
export type CupomPublico = {
  codigo: string;
  tipo: "percentual" | "valor";
  /** percent (5 = 5%) or reais */
  valor: number;
  minCadeiras: number;
  /** Applied by itself, without typing (like the old SENTARTE for 2+ chairs). */
  automatico: boolean;
};

export type Cupom = CupomPublico & {
  ativo: boolean;
  /** YYYY-MM-DD, last day it works (Brasília). */
  validoAte?: string;
  limiteUsos?: number;
  descricao?: string;
  criadoEm: number;
};

const arred = (v: number) => Math.round(v * 100) / 100;

export function normalizarCodigo(c: string) {
  return c
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 20);
}

/** Discount in reais for this cart; 0 when the minimum isn't met. Never more than the subtotal. */
function descontoDoCupom(c: CupomPublico, subtotal: number, qtdCadeiras: number) {
  if (qtdCadeiras < c.minCadeiras || subtotal <= 0) return 0;
  const d = c.tipo === "percentual" ? subtotal * (c.valor / 100) : c.valor;
  return arred(Math.min(subtotal, Math.max(0, d)));
}

/** The best coupon among those offered (no stacking — the biggest discount wins). */
export function melhorCupom(cupons: CupomPublico[], subtotal: number, qtdCadeiras: number) {
  let melhor: { cupom: CupomPublico; desconto: number } | null = null;
  for (const c of cupons) {
    const d = descontoDoCupom(c, subtotal, qtdCadeiras);
    if (d > 0 && (!melhor || d > melhor.desconto)) melhor = { cupom: c, desconto: d };
  }
  return melhor;
}

/** "5%" or "R$ 50,00". */
export function rotuloDesconto(c: Pick<CupomPublico, "tipo" | "valor">) {
  return c.tipo === "percentual"
    ? `${c.valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
    : c.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** The old fixed SENTARTE terms — used when the coupon storage isn't available. */
export const CUPOM_PADRAO: CupomPublico = { codigo: "SENTARTE", tipo: "percentual", valor: 5, minCadeiras: 2, automatico: true };
