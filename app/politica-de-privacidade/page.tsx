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
          O {site.nome} não tem cadastro de clientes: os pedidos são feitos pelo WhatsApp, pelo
          Instagram ou pagos aqui no site pelo Mercado Pago. Esta página explica quais dados são
          coletados e como eles são usados.
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
          <h2 className="font-serif text-lg text-ink">Estatísticas de visita</h2>
          <p className="mt-2">
            Para melhorar o site, registramos de forma anônima quantas pessoas visitam, quais páginas
            são vistas, o que é pesquisado, em quais botões clicam, a cidade aproximada e se o acesso é
            pelo celular ou pelo computador. Também guardamos o caminho de cada visita (por exemplo:
            &ldquo;abriu Cadeiras de time, colocou uma cadeira no carrinho&rdquo;), ligado só a um
            código aleatório que fica no seu navegador enquanto a aba está aberta. Não usamos cookies
            para isso e não guardamos seu nome, IP ou qualquer dado que identifique você. Os números
            ficam guardados por até 13 meses e o caminho das visitas por 30 dias.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-ink">Pedidos pagos pelo site</h2>
          <p className="mt-2">
            Quando você clica em pagar, guardamos seu nome, WhatsApp, cidade e os itens do pedido por até
            6 meses, para confirmar o pagamento e falar com você sobre ele, inclusive se o pagamento não
            for concluído.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-ink">Lista de novidades</h2>
          <p className="mt-2">
            Se você se cadastrar para receber novidades e cupons, guardamos seu nome e WhatsApp só para
            isso. Para sair da lista, é só pedir pelo WhatsApp que a gente apaga na hora.
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
