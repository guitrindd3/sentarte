import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SITE_NAME, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: `Como o ${SITE_NAME} trata os dados de quem entra em contato.`,
};

export default function PoliticaDePrivacidadePage() {
  return (
    <>
      <PageHeader titulo="Política de privacidade" />
      <section className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-sm leading-relaxed text-ink-soft">
        <p>
          O {SITE_NAME} não opera uma loja online com cadastro ou checkout: os pedidos são feitos
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
              href={whatsappUrl("Oi! Quero falar sobre meus dados pessoais com o Sentarte.")}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-marine hover:underline"
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
