import type { CartItem } from "./cart-context";
import { DESENHO_TEMAS } from "./desenho-model";
import { melhorCupom, type CupomPublico } from "./cupom";
import { CATEGORIA_COM_PRECO, PIX_DESCONTO, precoCadeira, quantosTasseis, rotuloTassel } from "./offer";
import { valorDoVale } from "./vale";

// Order math shared by the cart drawer (display) and /api/checkout (the
// amount actually charged). The server recomputes everything from here —
// it never trusts a price sent by the browser.

export type ItemDoPedido = Pick<CartItem, "categoriaSlug" | "modeloNome" | "quantidade" | "nomePersonalizado" | "tipoCadeira" | "personalizada" | "bracoMadeira" | "tassel" | "tasselQtd" | "tasselLado"> & {
  variante?: string;
  categoriaTitulo?: string;
  /** Monte a sua trama design (chair-link query string); see registrarPedido. */
  trama?: string;
};

const arred = (v: number) => Math.round(v * 100) / 100;

/**
 * Unit price of a chair line: personalized with a name or a desenho design.
 * `desenhos`: the server passes the real list (lib/grupos.ts nomesDesenho); in
 * the browser the card's own `personalizada` flag counts too.
 */
function precoUnitario(item: ItemDoPedido, desenhos?: Set<string>) {
  const desenho = desenhos ? desenhos.has(item.modeloNome) : DESENHO_TEMAS.includes(item.modeloNome) || Boolean(item.personalizada);
  return precoCadeira(Boolean(item.nomePersonalizado?.trim()) || desenho, item.tipoCadeira, Boolean(item.bracoMadeira), quantosTasseis(item));
}

/**
 * `cupons`: the coupons on offer (automatic + typed). The best ordinary coupon
 * is applied (no stacking); a typed vale-presente comes off on top of it.
 * Both only discount chairs; a vale-presente bought in the cart is charged in
 * full (no coupon, no Pix discount) and needs no shipping.
 */
export function calcularPedido(items: ItemDoPedido[], cupons: CupomPublico[] = [], desenhos?: Set<string>) {
  const cadeiras = items.filter((i) => i.categoriaSlug === CATEGORIA_COM_PRECO);
  const vales = items.flatMap((i) => {
    const valor = valorDoVale(i);
    return valor === null ? [] : [{ item: i, valor }];
  });
  const qtdCadeiras = cadeiras.reduce((s, i) => s + i.quantidade, 0);
  const qtdVales = vales.reduce((s, v) => s + v.item.quantidade, 0);
  const valorVales = arred(vales.reduce((s, v) => s + v.item.quantidade * v.valor, 0));
  const subtotal = arred(cadeiras.reduce((s, i) => s + i.quantidade * precoUnitario(i, desenhos), 0));
  const aplicado = melhorCupom(cupons.filter((c) => !c.vale), subtotal, qtdCadeiras);
  const cupom = aplicado?.cupom ?? null;
  const temCupom = Boolean(aplicado);
  const desconto = aplicado?.desconto ?? 0;
  const resto = arred(subtotal - desconto);
  const valeUsado = melhorCupom(cupons.filter((c) => c.vale), resto, qtdCadeiras);
  const vale = valeUsado?.cupom ?? null;
  const descontoVale = valeUsado?.desconto ?? 0;
  const totalCadeiras = arred(resto - descontoVale);
  const total = arred(totalCadeiras + valorVales);
  const totalPix = arred(totalCadeiras * (1 - PIX_DESCONTO) + valorVales);
  /** Only chairs and vales have a fixed price, so only those carts can be paid online. */
  const pagavel = items.length > 0 && cadeiras.length + vales.length === items.length;
  // Chairs per type, for the shipping quote (each type has its own package).
  const porTipo = { normal: 0, infantil: 0, reclinavel: 0 };
  for (const i of cadeiras) porTipo[i.tipoCadeira ?? "normal"] += i.quantidade;
  return {
    qtdCadeiras,
    subtotal,
    temCupom,
    cupom,
    desconto,
    vale,
    descontoVale,
    totalCadeiras,
    qtdVales,
    valorVales,
    /** Only vales: nothing to ship. */
    soVale: qtdVales > 0 && qtdCadeiras === 0,
    total,
    totalPix,
    pagavel,
    porTipo,
  };
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
  /** "É para presente?" (2026-10-21): the atelier sends the note on a card with the chair. */
  presente?: boolean;
  recado?: string;
};

/** "🎁 Presente — recado: …" line for the order texts, or "". */
export function linhaPresente(d: Pick<DadosEntrega, "presente" | "recado">) {
  if (!d.presente) return "";
  const r = (d.recado ?? "").trim();
  return r ? `🎁 É presente. Recado para o cartão: "${r}"` : "🎁 É presente (sem recado)";
}

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

/** `soVale`: an order with only vales-presente needs no address (nothing is shipped). */
export function entregaCompleta(d: DadosEntrega, soVale = false) {
  if (soVale) return Boolean(d.nome.trim() && d.telefone.replace(/\D/g, "").length >= 10 && cpfValido(d.cpf));
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
  if (!d.endereco.trim()) return `${d.nome} · ${d.telefone}`;
  return [
    `${d.nome} · ${d.telefone}`,
    `${d.endereco}, ${d.numero}${d.complemento ? ` (${d.complemento})` : ""}`,
    `${d.bairro ? `${d.bairro}, ` : ""}${d.cidade}/${d.uf} · CEP ${d.cep}`,
    linhaPresente(d),
  ]
    .filter(Boolean)
    .join("\n");
}

/** One line per cart item, as it goes to WhatsApp and to Mercado Pago. */
export function descricaoItem(i: ItemDoPedido) {
  const vale = valorDoVale(i) !== null;
  return (
    `${i.modeloNome} (x${i.quantidade})` +
    (i.variante ? ` — cor: ${i.variante}` : "") +
    (i.bracoMadeira ? " — braço de madeira" : "") +
    (i.tassel ? ` — ${rotuloTassel(i)}` : "") +
    (i.nomePersonalizado ? (vale ? ` — para: ${i.nomePersonalizado}` : ` — nome: "${i.nomePersonalizado}"`) : "")
  );
}

/** Payment title for Mercado Pago, e.g. "Pedido SentArte — 2 cadeiras e 1 vale-presente". */
export function tituloDoPedido(conta: { qtdCadeiras: number; qtdVales: number }) {
  const partes = [
    conta.qtdCadeiras ? `${conta.qtdCadeiras} cadeira${conta.qtdCadeiras === 1 ? "" : "s"}` : "",
    conta.qtdVales ? `${conta.qtdVales} vale${conta.qtdVales === 1 ? "" : "s"}-presente` : "",
  ].filter(Boolean);
  return `Pedido SentArte — ${partes.join(" e ")}`;
}

/** What the success page needs after coming back from Mercado Pago. */
export type PedidoSalvo = {
  referencia: string;
  forma: "pix" | "cartao";
  itens: ItemDoPedido[];
  entrega: DadosEntrega;
  total: number;
};

/** How an order was paid: the site takes Pix and card; sales typed in the admin (2026-10-24) can be anything. */
export type FormaPagamento = "pix" | "cartao" | "dinheiro" | "transferencia" | "outro";

/** "no Pix", "no cartão", "em dinheiro"… for order texts. */
export function noPagamento(forma: FormaPagamento) {
  return { pix: "no Pix", cartao: "no cartão", dinheiro: "em dinheiro", transferencia: "por transferência", outro: "" }[forma] ?? "";
}

export const PEDIDO_STORAGE_KEY = "sentarte-pedido";

/** Short public order number shown to the customer (e.g. "7K3D9Q2A"); /acompanhar finds the order by it. */
export function codigoDoPedido(ref: string) {
  return ref.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
}
