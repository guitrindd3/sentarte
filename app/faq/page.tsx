import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";
import { JsonLd } from "@/components/json-ld";
import {
  CUPOM_CODIGO,
  CUPOM_DESCONTO,
  CUPOM_MIN_ITENS,
  formatBRL,
  PARCELAS_MAX,
  PIX_DESCONTO,
  precoPix,
  PRAZO_PRODUCAO_DIAS_UTEIS,
  PRECO_CADEIRA,
  PRECO_CADEIRA_COM_NOME,
} from "@/lib/offer";
import { whatsappUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Perguntas frequentes",
  description:
    "Prazo, personalização, cuidados e trocas das peças SentArte.",
  path: "/faq",
});

const PERGUNTAS = [
  {
    pergunta: "Como faço um pedido?",
    resposta:
      "Pelo WhatsApp. Você escolhe o modelo, a cor e a personalização (quando o modelo permitir), e a gente confirma um resumo completo antes de começar a trançar.",
  },
  {
    pergunta: "Quanto custa uma cadeira?",
    resposta: `A cadeira de praia sai por ${formatBRL(PRECO_CADEIRA)}. Com um nome ou outra personalização trançada, sai por ${formatBRL(PRECO_CADEIRA_COM_NOME)}. No Pix tem ${Math.round(PIX_DESCONTO * 100)}% de desconto (${formatBRL(precoPix(PRECO_CADEIRA))}), e no cartão dá para parcelar em até ${PARCELAS_MAX}x (com a taxa do cartão).`,
  },
  {
    pergunta: "O frete é pago?",
    resposta: "Não. O frete é grátis para todo o Brasil.",
  },
  {
    pergunta: "Qual o prazo de produção?",
    resposta: `Cada cadeira é feita sob encomenda, à mão, e fica pronta em até ${PRAZO_PRODUCAO_DIAS_UTEIS} dias úteis depois que o pedido é confirmado. Depois disso, é só o tempo de entrega até você.`,
  },
  {
    pergunta: "Tem desconto levando mais de uma?",
    resposta: `Tem. Na compra de ${CUPOM_MIN_ITENS} cadeiras ou mais, use o cupom ${CUPOM_CODIGO} e ganhe ${Math.round(CUPOM_DESCONTO * 100)}% de desconto no pedido.`,
  },
  {
    pergunta: "Posso escolher as cores do meu time?",
    resposta:
      "Sim. As cores entram direto na trama, fio a fio — sem adesivo e sem estampa que descasca com o tempo.",
  },
  {
    pergunta: "Como faço a manutenção da cadeira?",
    resposta:
      "Basta lavar com água e sabão neutro e deixar secar à sombra. A corda náutica não absorve água, então não precisa de nenhum cuidado além disso.",
  },
  {
    pergunta: "Como funcionam trocas e devoluções?",
    resposta:
      "Consulte os detalhes na página de trocas e devoluções. Por serem peças feitas sob medida, a troca por arrependimento segue regras diferentes das de defeito de fabricação.",
  },
];

export default async function FaqPage() {
  const { site } = await getContent();

  return (
    <>
      <PageHeader titulo="Perguntas frequentes" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: PERGUNTAS.map((item) => ({
            "@type": "Question",
            name: item.pergunta,
            acceptedAnswer: { "@type": "Answer", text: item.resposta },
          })),
        }}
      />
      <section className="mx-auto max-w-6xl px-6 py-16 [&>*]:max-w-3xl">
        <div className="divide-y divide-line border-y border-line">
          {PERGUNTAS.map((item) => (
            <details key={item.pergunta} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-ink">
                {item.pergunta}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line font-sans text-xl leading-none text-ink transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
                {item.resposta}
              </p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-sm text-ink-soft">
          Não achou sua dúvida aqui?{" "}
          <a
            href={whatsappUrl(site.whatsappNumero, "Oi! Tenho uma dúvida que não encontrei no FAQ do site.")}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-ink hover:underline"
          >
            Fala com a gente no WhatsApp
          </a>
          .
        </p>
      </section>
    </>
  );
}
