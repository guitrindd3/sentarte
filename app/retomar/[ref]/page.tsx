import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { lerPedido } from "@/lib/clientes";
import { getContent } from "@/lib/content-store";
import { formatBRL } from "@/lib/offer";
import { codigoDoPedido, noPagamento } from "@/lib/pedido";
import { redisAtivo } from "@/lib/redis";
import { whatsappUrl } from "@/lib/urls";
import { Retomar } from "./retomar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Concluir pedido",
  robots: { index: false, follow: false },
};

// The reminder e-mail's button (lib/lembretes.ts). The URL carries the order's
// random reference (a UUID), like /acompanhar/<ref>. Orders saved with their
// cart (since 2026-11-05) go straight back into the cart; older ones, or a
// paid one, show a short page instead.
export default async function RetomarPedido({ params }: PageProps<"/retomar/[ref]">) {
  const { ref } = await params;
  if (!redisAtivo()) notFound();
  const p = await lerPedido(ref);
  if (!p) notFound();
  const pago = p.status === "pago";
  if (!pago && p.carrinho?.length) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Retomar itens={p.carrinho} cupom={p.cupomDigitado} />
      </section>
    );
  }
  const { site } = await getContent();
  const primeiroNome = p.nome.trim().split(/\s+/)[0];
  return (
    <>
      <PageHeader
        titulo={pago ? "Esse pedido já foi pago" : "Seu pedido"}
        resumo={pago ? `Tudo certo, ${primeiroNome}! O pagamento já foi aprovado.` : `Oi, ${primeiroNome}! Fale com a gente para concluir o seu pedido.`}
      />
      <section className="mx-auto max-w-xl px-6 py-14 text-sm">
        <ul className="space-y-1 text-ink">
          {p.itens.map((i, k) => (
            <li key={k}>{i.replace(/ — desenho: \S+$/, "")}</li>
          ))}
        </ul>
        <p className="mt-3 border-t border-line pt-3 text-ink-soft">
          Total: <strong className="text-ink">{formatBRL(p.valor)}</strong> {noPagamento(p.forma)}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {pago ? (
            <Link href={`/acompanhar/${p.ref}`} className="inline-flex items-center rounded-full bg-verde px-5 py-2.5 font-semibold text-white hover:bg-verde-escuro">
              Acompanhar o pedido
            </Link>
          ) : (
            <a
              href={whatsappUrl(site.whatsappNumero, `Oi! Quero concluir o meu pedido ${codigoDoPedido(p.ref)} (${p.itens.length} ${p.itens.length === 1 ? "item" : "itens"}).`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-verde px-5 py-2.5 font-semibold text-white hover:bg-verde-escuro"
            >
              Concluir pelo WhatsApp
            </a>
          )}
          <Link href="/" className="inline-flex items-center rounded-full border border-line px-5 py-2.5 font-medium text-ink hover:border-ink">
            Ver a loja
          </Link>
        </div>
      </section>
    </>
  );
}
