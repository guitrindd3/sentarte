import { NextResponse } from "next/server";
import { marcarPedido } from "@/lib/clientes";
import { anotarNoCaminho } from "@/lib/estatisticas";

export const dynamic = "force-dynamic";

/** Polled by the in-site Pix screen: asks Mercado Pago whether this payment was paid. */
export async function GET(req: Request) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const u = new URL(req.url);
  const id = u.searchParams.get("id") ?? "";
  const ref = u.searchParams.get("ref") ?? "";
  if (!token || !/^\d{5,20}$/.test(id) || !/^[a-z0-9-]{6,40}$/i.test(ref)) return NextResponse.json({ status: "desconhecido" });
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) return NextResponse.json({ status: "desconhecido" });
  const p = (await res.json()) as { status?: string; external_reference?: string; transaction_amount?: number };
  // Only answer for the order this browser created.
  if (p.external_reference !== ref) return NextResponse.json({ status: "desconhecido" });
  if (p.status === "approved") {
    const pedido = await marcarPedido(ref, "pago");
    if (pedido?.vid && pedido.status !== "pago") {
      await anotarNoCaminho(pedido.vid, { k: "p", x: (p.transaction_amount ?? pedido.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) });
    }
  }
  return NextResponse.json({ status: p.status ?? "desconhecido" }, { headers: { "Cache-Control": "no-store" } });
}
