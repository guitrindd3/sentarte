import { NextResponse } from "next/server";
import { normalizarWhatsapp, salvarPedidoIniciado } from "@/lib/clientes";
import { cuponsDoPedido } from "@/lib/cupons-store";
import { anotarNoCaminho, vidValido } from "@/lib/estatisticas";
import { SITE_URL } from "@/lib/nav";
import { calcularFrete } from "@/lib/frete-servidor";
import { PARCELAS_MAX } from "@/lib/offer";
import {
  calcularPedido,
  descricaoItem,
  entregaCompleta,
  type DadosEntrega,
  type ItemDoPedido,
} from "@/lib/pedido";

// Creates a Mercado Pago Checkout Pro payment and returns its URL. Needs the
// MERCADOPAGO_ACCESS_TOKEN env var (production access token of the store's
// Mercado Pago account). The amount is recomputed here from lib/pedido.ts —
// never taken from the request.

type Corpo = { forma: "pix" | "cartao"; itens: ItemDoPedido[]; entrega: DadosEntrega; referencia: string; vid?: string; cupom?: string };

export async function POST(req: Request) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ erro: "Pagamento online ainda não configurado." }, { status: 503 });

  let corpo: Corpo;
  try {
    corpo = (await req.json()) as Corpo;
  } catch {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }
  const { forma, entrega, referencia } = corpo;
  const itens = (Array.isArray(corpo.itens) ? corpo.itens : [])
    .slice(0, 30)
    .map((i) => ({
      categoriaSlug: String(i.categoriaSlug ?? ""),
      modeloNome: String(i.modeloNome ?? "").slice(0, 120),
      quantidade: Math.max(1, Math.min(20, Math.floor(Number(i.quantidade) || 1))),
      nomePersonalizado: i.nomePersonalizado ? String(i.nomePersonalizado).slice(0, 40) : undefined,
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
  if (!conta.pagavel || conta.total <= 0) {
    return NextResponse.json({ erro: "Esse carrinho só pode ser fechado pelo WhatsApp." }, { status: 400 });
  }
  if (forma !== "pix" && forma !== "cartao") return NextResponse.json({ erro: "Forma de pagamento inválida." }, { status: 400 });
  if (!entrega || !entregaCompleta(entrega)) {
    return NextResponse.json({ erro: "Preencha os dados de entrega." }, { status: 400 });
  }
  const ref = /^[a-z0-9-]{6,40}$/i.test(String(referencia)) ? String(referencia) : crypto.randomUUID();
  // shipping is recomputed here too (Espírito Santo ships free, see lib/frete-servidor.ts)
  const frete = await calcularFrete(entrega.cep, conta.qtdCadeiras, conta.total);
  if (!frete) {
    return NextResponse.json({ erro: "Para esse CEP o frete é combinado pelo WhatsApp." }, { status: 400 });
  }
  const valorProdutos = forma === "pix" ? conta.totalPix : conta.total;
  const valor = Math.round((valorProdutos + frete.valor) * 100) / 100;

  const telefone = entrega.telefone.replace(/\D/g, "");
  const preferencia = {
    items: [
      {
        id: ref,
        title: `Pedido SentArte — ${conta.qtdCadeiras} cadeira${conta.qtdCadeiras === 1 ? "" : "s"}`,
        description: itens.map(descricaoItem).join(" | ").slice(0, 250),
        category_id: "home",
        quantity: 1,
        currency_id: "BRL",
        unit_price: valorProdutos,
      },
      ...(frete.valor > 0
        ? [{ id: `${ref}-frete`, title: "Frete", category_id: "services", quantity: 1, currency_id: "BRL", unit_price: frete.valor }]
        : []),
    ],
    payer: {
      name: entrega.nome.trim().slice(0, 80),
      phone: { area_code: telefone.slice(0, 2), number: telefone.slice(2) },
      address: {
        zip_code: entrega.cep.replace(/\D/g, ""),
        street_name: entrega.endereco.trim().slice(0, 120),
        street_number: entrega.numero.trim().slice(0, 10),
      },
    },
    payment_methods:
      forma === "pix"
        ? {
            excluded_payment_types: [{ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }, { id: "atm" }, { id: "prepaid_card" }],
            installments: 1,
          }
        : {
            excluded_payment_types: [{ id: "bank_transfer" }, { id: "ticket" }, { id: "atm" }],
            installments: PARCELAS_MAX,
          },
    back_urls: {
      success: `${SITE_URL}/pedido`,
      pending: `${SITE_URL}/pedido`,
      failure: `${SITE_URL}/pedido`,
    },
    auto_return: "approved",
    external_reference: ref,
    statement_descriptor: "SENTARTE",
    metadata: { forma, entrega: `${entrega.cidade}/${entrega.uf}`, frete: frete.valor, servico_frete: frete.servico ?? "", cupom: conta.cupom?.codigo ?? "", desconto: conta.desconto },
  };

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `${ref}-${forma}`,
    },
    body: JSON.stringify(preferencia),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("mercadopago preference failed", res.status, await res.text());
    return NextResponse.json({ erro: "Não foi possível abrir o pagamento agora. Tente de novo ou peça pelo WhatsApp." }, { status: 502 });
  }
  const pref = (await res.json()) as { init_point?: string };
  if (!pref.init_point) return NextResponse.json({ erro: "Resposta inesperada do Mercado Pago." }, { status: 502 });
  // Kept so the atelier can follow up if the payment never completes (admin "Clientes").
  await salvarPedidoIniciado({
    ref,
    nome: entrega.nome.trim().slice(0, 80),
    whatsapp: normalizarWhatsapp(telefone) ?? telefone,
    cidade: `${entrega.cidade.trim()}/${entrega.uf.trim()}`.slice(0, 60),
    forma,
    itens: itens.map(descricaoItem),
    valor,
    vid: vidValido(corpo.vid) ? corpo.vid : undefined,
    cupom: conta.cupom?.codigo,
  });
  await anotarNoCaminho(corpo.vid, { k: "$", x: `${forma === "pix" ? "Pix" : "cartão"}, ${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` });
  return NextResponse.json({ url: pref.init_point, referencia: ref, valor });
}
