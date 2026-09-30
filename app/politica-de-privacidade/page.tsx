import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";
import { whatsappUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Política de privacidade",
  description:
    "Como o SentArte trata os dados de quem entra em contato.",
  path: "/politica-de-privacidade",
});

export default async function PoliticaDePrivacidadePage() {
  const { site } = await getContent();

  return (
    <>
      <PageHeader titulo="Política de privacidade" />
      <section className="mx-auto max-w-6xl space-y-6 px-6 py-16 [&>*]:max-w-3xl text-sm leading-relaxed text-ink-soft">
        <p>
          O {site.nome} não opera uma loja online com cadastro ou checkout: os pedidos são feitos
          diretamente pelo WhatsApp e pelo Instagram. Esta página explica quais dados são
          coletados nesse contato e como eles são usados.
        </p>
        <div>
          <h2 className="font-serif text-lg text-ink">Quais dados coletamos</h2>
          <p className="mt-2">
            Ao entrar em contato, você compartilha conosco o número de WhatsApp, o nome, e as
            informações necessárias para produzir seu pedido — como modelo, cor, personalização
            e endereço de entrega quando aplicável.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-ink">Como usamos esses dados</h2>
          <p className="mt-2">
            Usamos essas informações apenas para produzir e entregar seu pedido, e para
            responder dúvidas relacionadas a ele. Não vendemos nem compartilhamos seus dados com
            terceiros para fins de marketing.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-ink">Seus direitos</h2>
          <p className="mt-2">
            Você pode pedir a qualquer momento para saber quais dados temos sobre você, corrigi-los
            ou solicitar a exclusão, conforme a Lei Geral de Proteção de Dados (LGPD). Basta
            {" "}
            <a
              href={whatsappUrl(site.whatsappNumero, "Oi! Quero falar sobre meus dados pessoais com o SentArte.")}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-ink hover:underline"
            >
              enviar uma mensagem no WhatsApp
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
