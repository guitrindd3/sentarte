import type { Metadata } from "next";
import { PedidoResultado } from "@/components/pedido-resultado";
import { getContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seu pedido",
  robots: { index: false, follow: false },
};

type Situacao = "aprovado" | "pendente" | "recusado" | "desconhecido";

// Mercado Pago sends the buyer back here with ?payment_id=…&status=…. The
// status in the URL can be edited by anyone, so it's confirmed with the
// Mercado Pago API before telling the buyer it's paid.
async function confirmarPagamento(id: string | undefined) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token || !id || !/^\d+$/.test(id)) return null;
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const p = (await res.json()) as { status?: string; transaction_amount?: number; external_reference?: string; installments?: number };
  return p;
}

export default async function PedidoPage({ searchParams }: PageProps<"/pedido">) {
  const q = await searchParams;
  const pick = (k: string) => (typeof q[k] === "string" ? (q[k] as string) : undefined);
  const pagamentoId = pick("payment_id") ?? pick("collection_id");
  const confirmado = await confirmarPagamento(pagamentoId);
  // Only trust a payment whose own reference matches the order in the URL
  // (Mercado Pago sends both back), so a random payment id can't be used to
  // show "aprovado" or someone else's amount.
  const refUrl = pick("external_reference");
  const pagamento = confirmado && refUrl && confirmado.external_reference === refUrl ? confirmado : null;
  const { site } = await getContent();

  const status = pagamento?.status ?? pick("status") ?? pick("collection_status");
  const situacao: Situacao =
    pagamento?.status === "approved"
      ? "aprovado"
      : status === "pending" || status === "in_process" || status === "authorized"
        ? "pendente"
        : status === "rejected" || status === "cancelled" || status === "null" || pick("status") === "failure"
          ? "recusado"
          : "desconhecido";

  return (
    <PedidoResultado
      situacao={situacao}
      pagamentoId={pagamentoId}
      referencia={pagamento?.external_reference ?? pick("external_reference")}
      valorPago={pagamento?.status === "approved" ? pagamento.transaction_amount : undefined}
      parcelas={pagamento?.installments}
      whatsappNumero={site.whatsappNumero}
    />
  );
}
