import { NextResponse } from "next/server";
import { prepararPedido, registrarPedido, type CorpoPedido } from "@/lib/checkout-servidor";
import { SITE_URL } from "@/lib/nav";
import { descricaoItem } from "@/lib/pedido";

// Pix paid INSIDE the site (2026-10-05, user didn't want buyers sent to the
// Mercado Pago page): creates a Pix payment through the Payments API and
// returns its QR code / "copia e cola"; the checkout form then polls
// /api/pix/status until it's approved. Card payments still use Checkout Pro.

const VALIDADE_MIN = 30;

function dataMP(d: Date) {
  // Mercado Pago wants an ISO date with offset, e.g. 2026-10-06T10:30:00.000-03:00
  const local = new Date(d.getTime() - 3 * 3600_000);
  return local.toISOString().replace("Z", "-03:00");
}

export async function POST(req: Request) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ erro: "Pagamento online ainda não configurado." }, { status: 503 });
  let corpo: CorpoPedido & { email?: string };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }
  const email = String(corpo.email ?? "").trim().toLowerCase().slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ erro: "Confira o e-mail: o Mercado Pago manda o comprovante do Pix para ele." }, { status: 400 });
  }
  const pronto = await prepararPedido({ ...corpo, forma: "pix" });
  if (!pronto.ok) return NextResponse.json({ erro: pronto.erro }, { status: 400 });
  const { ref, itens, conta, frete, valor, entrega } = pronto;
  const [nome, ...sobrenome] = entrega.nome.trim().split(/\s+/);
  const expira = new Date(Date.now() + VALIDADE_MIN * 60_000);

  const res = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `${ref}-pix-site`,
    },
    body: JSON.stringify({
      transaction_amount: valor,
      description: `Pedido SentArte — ${conta.qtdCadeiras} cadeira${conta.qtdCadeiras === 1 ? "" : "s"}`.slice(0, 120),
      payment_method_id: "pix",
      external_reference: ref,
      notification_url: `${SITE_URL}/api/mercadopago`,
      date_of_expiration: dataMP(expira),
      statement_descriptor: "SENTARTE",
      payer: { email, first_name: nome.slice(0, 40), last_name: sobrenome.join(" ").slice(0, 60) || nome.slice(0, 40) },
      additional_info: {
        items: itens.map((i) => ({ id: ref, title: descricaoItem(i).slice(0, 120), quantity: 1, unit_price: valor })).slice(0, 1),
      },
      metadata: { forma: "pix", no_site: true, entrega: `${entrega.cidade}/${entrega.uf}`, frete: frete.valor, cupom: conta.cupom?.codigo ?? "", desconto: conta.desconto },
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("mercadopago pix failed", res.status, (await res.text()).slice(0, 500));
    return NextResponse.json({ erro: "Não deu para gerar o Pix agora. Tente o cartão ou peça pelo WhatsApp." }, { status: 502 });
  }
  const pg = (await res.json()) as {
    id?: number;
    status?: string;
    point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } };
  };
  const dados = pg.point_of_interaction?.transaction_data;
  if (!pg.id || !dados?.qr_code) {
    console.error("mercadopago pix unexpected", JSON.stringify(pg).slice(0, 500));
    return NextResponse.json({ erro: "Resposta inesperada do Mercado Pago. Tente o cartão ou peça pelo WhatsApp." }, { status: 502 });
  }
  await registrarPedido(pronto, corpo.vid);
  return NextResponse.json({
    id: String(pg.id),
    referencia: ref,
    valor,
    copiaECola: dados.qr_code,
    qrBase64: dados.qr_code_base64 ?? null,
    expiraEm: expira.toISOString(),
  });
}
