import "server-only";
import { normalizarWhatsapp, salvarPedidoIniciado } from "./clientes";
import { cuponsDoPedido } from "./cupons-store";
import { anotarNoCaminho, vidValido } from "./estatisticas";
import { calcularFrete } from "./frete-servidor";
import { tipoValido } from "./offer";
import { calcularPedido, descricaoItem, entregaCompleta, type DadosEntrega, type ItemDoPedido } from "./pedido";

// Shared by the card (Checkout Pro redirect, /api/checkout) and the in-site
// Pix (/api/pix) payments: everything charged is recomputed here — items,
// coupon, shipping — never taken from the browser.

export type CorpoPedido = {
  forma: "pix" | "cartao";
  itens: ItemDoPedido[];
  entrega: DadosEntrega;
  referencia: string;
  vid?: string;
  cupom?: string;
};

export async function prepararPedido(corpo: CorpoPedido) {
  const { forma, entrega, referencia } = corpo;
  const itens = (Array.isArray(corpo.itens) ? corpo.itens : []).slice(0, 30).map((i) => ({
    categoriaSlug: String(i.categoriaSlug ?? ""),
    modeloNome: String(i.modeloNome ?? "").slice(0, 120),
    quantidade: Math.max(1, Math.min(20, Math.floor(Number(i.quantidade) || 1))),
    nomePersonalizado: i.nomePersonalizado ? String(i.nomePersonalizado).slice(0, 40) : undefined,
    tipoCadeira: tipoValido(i.tipoCadeira),
    variante: i.variante ? String(i.variante).slice(0, 40) : undefined,
  }));

  // Coupons are looked up again here (the browser only sends the typed code).
  let cupons: Awaited<ReturnType<typeof cuponsDoPedido>> = [];
  try {
    cupons = await cuponsDoPedido(typeof corpo.cupom === "string" ? corpo.cupom.slice(0, 30) : undefined);
  } catch (err) {
    console.error("checkout cupons", err);
  }
  const conta = calcularPedido(itens, cupons);
  if (!conta.pagavel || conta.total <= 0) return { ok: false, erro: "Esse carrinho só pode ser fechado pelo WhatsApp." } as const;
  if (forma !== "pix" && forma !== "cartao") return { ok: false, erro: "Forma de pagamento inválida." } as const;
  if (!entrega || !entregaCompleta(entrega)) return { ok: false, erro: "Preencha os dados de entrega." } as const;
  const ref = /^[a-z0-9-]{6,40}$/i.test(String(referencia)) ? String(referencia) : crypto.randomUUID();
  // shipping is recomputed here too (Espírito Santo ships free, see lib/frete-servidor.ts)
  const frete = await calcularFrete(entrega.cep, conta.porTipo, conta.total);
  if (!frete) return { ok: false, erro: "Para esse CEP o frete é combinado pelo WhatsApp." } as const;
  const valorProdutos = forma === "pix" ? conta.totalPix : conta.total;
  const valor = Math.round((valorProdutos + frete.valor) * 100) / 100;
  const telefone = entrega.telefone.replace(/\D/g, "");
  return { ok: true, forma, ref, itens, conta, frete, valorProdutos, valor, entrega, telefone } as const;
}

type Pronto = Extract<Awaited<ReturnType<typeof prepararPedido>>, { ok: true }>;

/** Saves the started order (admin "Clientes") and notes it on the visit journey. */
export async function registrarPedido(p: Pronto, vid?: string) {
  await salvarPedidoIniciado({
    ref: p.ref,
    nome: p.entrega.nome.trim().slice(0, 80),
    whatsapp: normalizarWhatsapp(p.telefone) ?? p.telefone,
    cidade: `${p.entrega.cidade.trim()}/${p.entrega.uf.trim()}`.slice(0, 60),
    forma: p.forma,
    itens: p.itens.map(descricaoItem),
    valor: p.valor,
    vid: vidValido(vid) ? vid : undefined,
    cupom: p.conta.cupom?.codigo,
    entrega: {
      nome: p.entrega.nome.trim().slice(0, 80),
      telefone: p.telefone,
      email: (p.entrega.email ?? "").trim().slice(0, 120) || undefined,
      cpf: (p.entrega.cpf ?? "").replace(/\D/g, ""),
      cep: p.entrega.cep.replace(/\D/g, ""),
      endereco: p.entrega.endereco.trim().slice(0, 120),
      numero: p.entrega.numero.trim().slice(0, 15),
      complemento: (p.entrega.complemento ?? "").trim().slice(0, 60),
      bairro: (p.entrega.bairro ?? "").trim().slice(0, 60),
      cidade: p.entrega.cidade.trim().slice(0, 60),
      uf: p.entrega.uf.trim().toUpperCase().slice(0, 2),
    },
    porTipo: p.conta.porTipo,
    frete: { valor: p.frete.valor, servico: p.frete.servico },
  });
  await anotarNoCaminho(vid, {
    k: "$",
    x: `${p.forma === "pix" ? "Pix" : "cartão"}, ${p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
  });
}
