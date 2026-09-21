import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";
import { whatsappUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description: "Regras de troca e devolução para peças feitas sob encomenda pelo Sentarte.",
};

export default async function PoliticaDeTrocaEDevolucaoPage() {
  const { site } = await getContent();

  return (
    <>
      <PageHeader titulo="Trocas e devoluções" />
      <section className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-sm leading-relaxed text-ink-soft">
        <div>
          <h2 className="font-serif text-lg text-ink">Defeito de fabricação</h2>
          <p className="mt-2">
            Se a peça chegar com defeito de fabricação — na trama, na estrutura ou na
            personalização combinada — entre em contato em até 7 dias corridos após o
            recebimento. Vamos avaliar o caso e resolver com reparo, troca ou reembolso.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-ink">Arrependimento</h2>
          <p className="mt-2">
            Como cada peça é feita sob medida — na cor, na trama ou com uma personalização
            específica — pedidos personalizados não entram na troca por simples arrependimento
            depois que a produção é iniciada. Peças sem personalização seguem o direito de
            arrependimento em até 7 dias após o recebimento, conforme o Código de Defesa do
            Consumidor.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-ink">Como pedir uma troca</h2>
          <p className="mt-2">
            Toda solicitação é feita pelo mesmo canal do pedido —{" "}
            <a
              href={whatsappUrl(site.whatsappNumero, "Oi! Preciso falar sobre uma troca ou devolução.")}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-ink hover:underline"
            >
              fale com a gente pelo WhatsApp
            </a>{" "}
            com fotos da peça e o número do pedido.
          </p>
        </div>
      </section>
    </>
  );
}
