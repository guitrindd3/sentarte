import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Envio",
  description: "Como funciona o envio e a retirada das peças do Sentarte.",
};

export default function PoliticaDeEnvioPage() {
  return (
    <>
      <PageHeader titulo="Envio" />
      <section className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-sm leading-relaxed text-ink-soft">
        <div>
          <h2 className="font-serif text-lg text-ink">Produção sob encomenda</h2>
          <p className="mt-2">
            Cada peça começa a ser trançada só depois que o pedido é confirmado pelo WhatsApp. O
            prazo de envio é combinado ali, considerando a fila de produção e a complexidade da
            personalização.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-ink">Formas de envio</h2>
          <p className="mt-2">
            Trabalhamos com transportadora e correio para todo o Brasil, e com retirada
            combinada para quem estiver na região. O valor do frete é calculado por CEP no
            momento da confirmação do pedido.
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
