import { formatBRL, PRECO_CADEIRA, PRECO_CADEIRA_COM_NOME } from "./offer";

// Vale-presente (2026-10-19, user: "um código com valor em R$, bom para o
// Natal"). Bought like any cart item; when the payment is approved the site
// creates a one-time coupon of that value (lib/clientes.ts → criarVales) and
// shows the code on /pedido and /acompanhar. It's spent on chairs, on top of
// the automatic coupon (lib/pedido.ts), in one go.

export const CATEGORIA_VALE = "vale-presente";
export const VALIDADE_VALE_DIAS = 365;

export const VALORES_VALE: { valor: number; rotulo: string }[] = [
  { valor: 100, rotulo: formatBRL(100) },
  { valor: 200, rotulo: formatBRL(200) },
  { valor: 300, rotulo: formatBRL(300) },
  { valor: PRECO_CADEIRA, rotulo: "Uma cadeira" },
  { valor: PRECO_CADEIRA_COM_NOME, rotulo: "Uma cadeira com nome" },
];

export const nomeDoVale = (valor: number) => `Vale-presente de ${formatBRL(valor)}`;

/** The value of a vale cart line, from its name — only the values on sale count. */
export function valorDoVale(item: { categoriaSlug: string; modeloNome: string }) {
  if (item.categoriaSlug !== CATEGORIA_VALE) return null;
  return VALORES_VALE.find((v) => nomeDoVale(v.valor) === item.modeloNome)?.valor ?? null;
}

/** "VP" + 8 letters/digits without look-alikes (no 0/O, 1/I). */
export function novoCodigoVale() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `VP${[...bytes].map((b) => letras[b % letras.length]).join("")}`;
}
