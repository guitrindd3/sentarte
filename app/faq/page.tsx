import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";
import { whatsappUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description: "Prazo, personalização, cuidados e trocas das peças Sentarte.",
};

const PERGUNTAS = [
  {
    pergunta: "Como faço um pedido?",
    resposta:
      "Pelo WhatsApp. Você escolhe o modelo, a cor e a personalização (quando o modelo permitir), e a gente confirma um resumo completo antes de começar a trançar.",
  },
  {
    pergunta: "Qual o prazo de produção?",
    resposta:
      "Cada peça é feita sob encomenda, à mão. O prazo varia com a fila de produção e a complexidade da personalização — a gente informa uma data estimada assim que o pedido é confirmado.",
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
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="divide-y divide-line border-y border-line">
          {PERGUNTAS.map((item) => (
            <details key={item.pergunta} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-ink">
                {item.pergunta}
                <span className="text-marine transition-transform group-open:rotate-45">+</span>
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
            className="font-medium text-marine hover:underline"
          >
            Fala com a gente no WhatsApp
          </a>
          .
        </p>
      </section>
    </>
  );
}
