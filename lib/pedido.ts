import type { CartItem } from "./cart-context";
import { DESENHO_TEMAS } from "./desenho-model";
import {
  CATEGORIA_COM_PRECO,
  CUPOM_DESCONTO,
  CUPOM_MIN_ITENS,
  PIX_DESCONTO,
  precoCadeira,
} from "./offer";

// Order math shared by the cart drawer (display) and /api/checkout (the
// amount actually charged). The server recomputes everything from here —
// it never trusts a price sent by the browser.

export type ItemDoPedido = Pick<CartItem, "categoriaSlug" | "modeloNome" | "quantidade" | "nomePersonalizado"> & {
  variante?: string;
  categoriaTitulo?: string;
};

const arred = (v: number) => Math.round(v * 100) / 100;

/** Unit price of a chair line: personalized with a name or a desenho design. */
export function precoUnitario(item: ItemDoPedido) {
  const desenho = DESENHO_TEMAS.includes(item.modeloNome);
  return precoCadeira(Boolean(item.nomePersonalizado?.trim()) || desenho);
}

export function calcularPedido(items: ItemDoPedido[]) {
  const cadeiras = items.filter((i) => i.categoriaSlug === CATEGORIA_COM_PRECO);
  const qtdCadeiras = cadeiras.reduce((s, i) => s + i.quantidade, 0);
  const subtotal = arred(cadeiras.reduce((s, i) => s + i.quantidade * precoUnitario(i), 0));
  const temCupom = qtdCadeiras >= CUPOM_MIN_ITENS;
  const desconto = temCupom ? arred(subtotal * CUPOM_DESCONTO) : 0;
  const total = arred(subtotal - desconto);
  const totalPix = arred(total * (1 - PIX_DESCONTO));
  /** Only chairs have a fixed price, so only an all-chair cart can be paid online. */
  const pagavel = items.length > 0 && cadeiras.length === items.length;
  return { qtdCadeiras, subtotal, temCupom, desconto, total, totalPix, pagavel };
}

export type DadosEntrega = {
  nome: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export const ENTREGA_VAZIA: DadosEntrega = {
  nome: "",
  telefone: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

export function entregaCompleta(d: DadosEntrega) {
  return Boolean(
    d.nome.trim() &&
      d.telefone.replace(/\D/g, "").length >= 10 &&
      d.cep.replace(/\D/g, "").length === 8 &&
      d.endereco.trim() &&
      d.numero.trim() &&
      d.cidade.trim() &&
      d.uf.trim()
  );
}

export function entregaEmTexto(d: DadosEntrega) {
  return [
    `${d.nome} · ${d.telefone}`,
    `${d.endereco}, ${d.numero}${d.complemento ? ` (${d.complemento})` : ""}`,
    `${d.bairro ? `${d.bairro}, ` : ""}${d.cidade}/${d.uf} · CEP ${d.cep}`,
  ].join("\n");
}

/** One line per cart item, as it goes to WhatsApp and to Mercado Pago. */
export function descricaoItem(i: ItemDoPedido) {
  return (
    `${i.modeloNome} (x${i.quantidade})` +
    (i.variante ? ` — cor: ${i.variante}` : "") +
    (i.nomePersonalizado ? ` — nome: "${i.nomePersonalizado}"` : "")
  );
}

/** What the success page needs after coming back from Mercado Pago. */
export type PedidoSalvo = {
  referencia: string;
  forma: "pix" | "cartao";
  itens: ItemDoPedido[];
  entrega: DadosEntrega;
  total: number;
};

export const PEDIDO_STORAGE_KEY = "sentarte-pedido";
