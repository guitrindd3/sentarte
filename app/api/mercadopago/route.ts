import { NextResponse } from "next/server";
import { marcarPedido } from "@/lib/clientes";

export const dynamic = "force-dynamic";

// Mercado Pago payment notifications (webhook, 2026-10-06). Every payment the
// site creates (Pix, card, Checkout Pro) carries notification_url pointing
// here, so an order becomes "pago" — and the sale alert goes out — even when
// the buyer closes the page before coming back to /pedido.
//
// The notification body is NOT trusted: only the payment id is taken from it,
// and the payment itself (status, order reference) is read back from the
// Mercado Pago API with our own token. A forged call can at most make us look
// up a real payment and record its true status.

const STATUS: Record<string, "pago" | "pendente" | "recusado"> = {
  approved: "pago",
  pending: "pendente",
  in_process: "pendente",
  authorized: "pendente",
  rejected: "recusado",
  cancelled: "recusado",
};

export async function POST(req: Request) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ ok: true });
  const u = new URL(req.url);
  let corpo: { type?: string; topic?: string; action?: string; data?: { id?: string | number } } = {};
  try {
    corpo = await req.json();
  } catch {}
  const tipo = corpo.type ?? corpo.topic ?? u.searchParams.get("type") ?? u.searchParams.get("topic");
  const id = String(corpo.data?.id ?? u.searchParams.get("data.id") ?? u.searchParams.get("id") ?? "");
  // Only payment notifications matter (merchant_order etc. are acknowledged and ignored).
  if (tipo !== "payment" || !/^\d{5,20}$/.test(id)) return NextResponse.json({ ok: true });

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) {
    // 404 right after creation happens; a non-2xx makes Mercado Pago retry later.
    return NextResponse.json({ ok: false }, { status: res.status === 404 ? 404 : 502 });
  }
  const p = (await res.json()) as { status?: string; external_reference?: string };
  const novo = STATUS[p.status ?? ""];
  // marcarPedido also counts the coupon, notes the visit journey and sends the sale alert — once.
  if (p.external_reference && novo) await marcarPedido(p.external_reference, novo);
  return NextResponse.json({ ok: true });
}
