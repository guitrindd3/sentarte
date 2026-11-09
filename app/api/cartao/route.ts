import { NextResponse } from "next/server";
import { prepararPedido, registrarPedido, type CorpoPedido } from "@/lib/checkout-servidor";
import { anotarRecusa, marcarPedido } from "@/lib/clientes";
import { MOTIVO_CLIENTE_PADRAO, MOTIVOS_CLIENTE } from "@/lib/recusa-cartao";
import { PARCELAS_MAX } from "@/lib/offer";
import { SITE_URL } from "@/lib/nav";
import { descricaoItem, tituloDoPedido } from "@/lib/pedido";

// Card paid INSIDE the site (2026-10-06): the Mercado Pago Card Payment Brick
// (in the browser) turns the card into a one-time token — the card number never
// reaches this server — and this route charges it through the Payments API.
// The amount is recomputed from the order, never taken from the browser.

type Cartao = {
  token?: string;
  payment_method_id?: string;
  issuer_id?: string | number;
  installments?: number;
  payer?: { email?: string; identification?: { type?: string; number?: string } };
};

export async function POST(req: Request) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ erro: "Pagamento online ainda não configurado." }, { status: 503 });
  let corpo: CorpoPedido & { cartao?: Cartao };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }
  const c = corpo.cartao ?? {};
  if (!c.token || !c.payment_method_id) return NextResponse.json({ erro: "Confira os dados do cartão." }, { status: 400 });
  const email = String(c.payer?.email ?? corpo.entrega?.email ?? "").trim().toLowerCase().slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ erro: "Confira o e-mail." }, { status: 400 });

  const pronto = await prepararPedido({ ...corpo, forma: "cartao" });
  if (!pronto.ok) return NextResponse.json({ erro: pronto.erro }, { status: 400 });
  const { ref, itens, conta, frete, valor, entrega } = pronto;
  const parcelas = Math.max(1, Math.min(PARCELAS_MAX, Math.floor(Number(c.installments) || 1)));
  const [nome, ...sobrenome] = entrega.nome.trim().split(/\s+/);

  const res = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // the card token is single-use, so it makes each attempt unique
      "X-Idempotency-Key": `${ref}-cartao-${c.token.slice(-12)}`,
    },
    body: JSON.stringify({
      transaction_amount: valor,
      token: c.token,
      description: tituloDoPedido(conta).slice(0, 120),
      installments: parcelas,
      payment_method_id: c.payment_method_id,
      issuer_id: c.issuer_id ? Number(c.issuer_id) : undefined,
      external_reference: ref,
      notification_url: `${SITE_URL}/api/mercadopago`,
      statement_descriptor: "SENTARTE",
      payer: {
        email,
        first_name: nome.slice(0, 40),
        last_name: sobrenome.join(" ").slice(0, 60) || nome.slice(0, 40),
        identification: c.payer?.identification?.number
          ? { type: c.payer.identification.type || "CPF", number: String(c.payer.identification.number).replace(/\D/g, "") }
          : undefined,
      },
      additional_info: {
        items: [{ id: ref, title: itens.map(descricaoItem).join(" | ").slice(0, 120), quantity: 1, unit_price: valor }],
        payer: { first_name: nome.slice(0, 40), phone: { area_code: pronto.telefone.slice(0, 2), number: pronto.telefone.slice(2) } },
        ...(conta.soVale
          ? {}
          : { shipments: { receiver_address: { zip_code: entrega.cep.replace(/\D/g, ""), street_name: entrega.endereco.slice(0, 120), street_number: entrega.numero.slice(0, 10) } } }),
      },
      metadata: { forma: "cartao", no_site: true, entrega: `${entrega.cidade}/${entrega.uf}`, frete: frete.valor, cupom: conta.cupom?.codigo ?? "", desconto: conta.desconto },
    }),
    cache: "no-store",
  });
  const pg = (await res.json().catch(() => ({}))) as { id?: number; status?: string; status_detail?: string; message?: string };
  if (!res.ok || !pg.id) {
    console.error("mercadopago card failed", res.status, JSON.stringify(pg).slice(0, 500));
    return NextResponse.json({ erro: "Não deu para processar o cartão agora. Confira os dados ou pague no Pix." }, { status: 502 });
  }
  await registrarPedido(pronto, corpo.vid);
  if (pg.status === "approved") {
    await marcarPedido(ref, "pago");
  } else if (pg.status === "in_process" || pg.status === "pending") {
    await marcarPedido(ref, "pendente");
  } else if (pg.status === "rejected") {
    await marcarPedido(ref, "recusado");
    await anotarRecusa(ref, { id: String(pg.id), detalhe: pg.status_detail });
  }
  return NextResponse.json({
    id: String(pg.id),
    referencia: ref,
    status: pg.status,
    motivo: pg.status === "rejected" ? MOTIVOS_CLIENTE[pg.status_detail ?? ""] ?? MOTIVO_CLIENTE_PADRAO : undefined,
  });
}
