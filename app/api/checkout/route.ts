import { NextResponse } from "next/server";
import { prepararPedido, registrarPedido, type CorpoPedido } from "@/lib/checkout-servidor";
import { SITE_URL } from "@/lib/nav";
import { PARCELAS_MAX } from "@/lib/offer";
import { descricaoItem } from "@/lib/pedido";

// Creates a Mercado Pago Checkout Pro payment and returns its URL. Needs the
// MERCADOPAGO_ACCESS_TOKEN env var (production access token of the store's
// Mercado Pago account). The amount is recomputed here from lib/pedido.ts —
// never taken from the request.

export async function POST(req: Request) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ erro: "Pagamento online ainda não configurado." }, { status: 503 });

  let corpo: CorpoPedido;
  try {
    corpo = (await req.json()) as CorpoPedido;
  } catch {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }
  const pronto = await prepararPedido(corpo);
  if (!pronto.ok) return NextResponse.json({ erro: pronto.erro }, { status: 400 });
  const { forma, ref, itens, conta, frete, valorProdutos, valor, entrega, telefone } = pronto;

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
  await registrarPedido(pronto, corpo.vid);
  return NextResponse.json({ url: pref.init_point, referencia: ref, valor });
}
