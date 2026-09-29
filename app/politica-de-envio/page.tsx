import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/page-header";
import { PRAZO_PRODUCAO_DIAS_UTEIS } from "@/lib/offer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Envio",
  description:
    "Como funciona o envio e a retirada das peças do SentArte.",
  path: "/politica-de-envio",
});

export default function PoliticaDeEnvioPage() {
  return (
    <>
      <PageHeader titulo="Envio" />
      <section className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-sm leading-relaxed text-ink-soft">
        <div>
          <h2 className="font-serif text-lg text-ink">Produção sob encomenda</h2>
          <p className="mt-2">
            Cada peça começa a ser trançada só depois que o pedido é confirmado pelo WhatsApp e
            fica pronta em até {PRAZO_PRODUCAO_DIAS_UTEIS} dias úteis. Aí ela já sai para envio.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-ink">Frete grátis</h2>
          <p className="mt-2">
            O frete é grátis para todo o Brasil. Enviamos por transportadora ou correio, e
            também dá para combinar a retirada se você estiver na região.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-ink">Acompanhamento</h2>
          <p className="mt-2">
            Assim que a peça é despachada, o código de rastreio é enviado pelo mesmo canal do
            pedido.
          </p>
        </div>
      </section>
    </>
  );
}
