import type { CartItem } from "./cart-context";
import { DESENHO_TEMAS } from "./desenho-model";
import { melhorCupom, type CupomPublico } from "./cupom";
import { CATEGORIA_COM_PRECO, PIX_DESCONTO, precoCadeira } from "./offer";

// Order math shared by the cart drawer (display) and /api/checkout (the
// amount actually charged). The server recomputes everything from here —
// it never trusts a price sent by the browser.

export type ItemDoPedido = Pick<CartItem, "categoriaSlug" | "modeloNome" | "quantidade" | "nomePersonalizado" | "tipoCadeira"> & {
  variante?: string;
  categoriaTitulo?: string;
};

const arred = (v: number) => Math.round(v * 100) / 100;

/** Unit price of a chair line: personalized with a name or a desenho design. */
function precoUnitario(item: ItemDoPedido) {
  const desenho = DESENHO_TEMAS.includes(item.modeloNome);
  return precoCadeira(Boolean(item.nomePersonalizado?.trim()) || desenho, item.tipoCadeira);
}

/** `cupons`: the coupons on offer (automatic + typed); the best one is applied, no stacking. */
export function calcularPedido(items: ItemDoPedido[], cupons: CupomPublico[] = []) {
  const cadeiras = items.filter((i) => i.categoriaSlug === CATEGORIA_COM_PRECO);
  const qtdCadeiras = cadeiras.reduce((s, i) => s + i.quantidade, 0);
  const subtotal = arred(cadeiras.reduce((s, i) => s + i.quantidade * precoUnitario(i), 0));
  const aplicado = melhorCupom(cupons, subtotal, qtdCadeiras);
  const cupom = aplicado?.cupom ?? null;
  const temCupom = Boolean(aplicado);
  const desconto = aplicado?.desconto ?? 0;
  const total = arred(subtotal - desconto);
  const totalPix = arred(total * (1 - PIX_DESCONTO));
  /** Only chairs have a fixed price, so only an all-chair cart can be paid online. */
  const pagavel = items.length > 0 && cadeiras.length === items.length;
  // Chairs per type, for the shipping quote (each type has its own package).
  const porTipo = { normal: 0, infantil: 0, reclinavel: 0 };
  for (const i of cadeiras) porTipo[i.tipoCadeira ?? "normal"] += i.quantidade;
  return { qtdCadeiras, subtotal, temCupom, cupom, desconto, total, totalPix, pagavel, porTipo };
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
