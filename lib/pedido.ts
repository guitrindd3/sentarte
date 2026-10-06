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
  /** Only needed for the in-site Pix (Mercado Pago sends the receipt there). */
  email?: string;
  /** Required since 2026-10-06: carriers ask for it on the shipping label. Not kept in localStorage. */
  cpf?: string;
};

/** Brazilian CPF check digits. */
export function cpfValido(cpf: string | undefined) {
  const n = (cpf ?? "").replace(/\D/g, "");
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  const dig = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(n[i]) * (ate + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dig(9) === Number(n[9]) && dig(10) === Number(n[10]);
}

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
      d.uf.trim() &&
      cpfValido(d.cpf)
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

/** Short public order number shown to the customer (e.g. "7K3D9Q2A"); /acompanhar finds the order by it. */
export function codigoDoPedido(ref: string) {
  return ref.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
}
