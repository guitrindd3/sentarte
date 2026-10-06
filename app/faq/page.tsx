import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";
import { TextoRico, textoSimples } from "@/components/texto-rico";
import { textosDaPagina } from "@/lib/textos-paginas";
import { JsonLd } from "@/components/json-ld";
import { rotuloDesconto } from "@/lib/cupom";
import { cuponsDaVitrine } from "@/lib/cupons-store";
import { whatsappUrl } from "@/lib/urls";

// Pre-rendered and cached (2026-10-06, the site felt slow): rebuilt every 10 min
// at most, and right away when the admin saves (revalidatePath("/", "layout")).
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Perguntas frequentes",
  description:
    "Prazo, personalização, cuidados e trocas das peças SentArte.",
  path: "/faq",
});


export default async function FaqPage() {
  const { site, paginas } = await getContent();
  const tp = textosDaPagina(paginas, "faq");
  const PERGUNTAS_FIXAS = tp.blocos("perguntas").map((b) => ({ pergunta: textoSimples(b.titulo, site.nome), resposta: b.texto }));
  // The multi-chair discount comes from the admin's automatic coupon (if one is on).
  const multi = (await cuponsDaVitrine()).filter((c) => c.minCadeiras >= 2).sort((a, b) => a.minCadeiras - b.minCadeiras)[0];
  const PERGUNTAS = multi
    ? [
        ...PERGUNTAS_FIXAS.slice(0, 5),
        {
          pergunta: "Tem desconto levando mais de uma?",
          resposta: `Tem. Na compra de ${multi.minCadeiras} cadeiras ou mais, o cupom ${multi.codigo} entra sozinho no carrinho e dá ${rotuloDesconto(multi)} de desconto no pedido.`,
        },
        ...PERGUNTAS_FIXAS.slice(5),
      ]
    : PERGUNTAS_FIXAS;

  return (
    <>
      <PageHeader titulo={textoSimples(tp.linha("titulo"), site.nome)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: PERGUNTAS.map((item) => ({
            "@type": "Question",
            name: item.pergunta,
            acceptedAnswer: { "@type": "Answer", text: textoSimples(item.resposta, site.nome) },
          })),
        }}
      />
      <section className="mx-auto max-w-6xl px-6 py-16 [&>*]:max-w-3xl">
        <div className="divide-y divide-line border-y border-line">
          {PERGUNTAS.map((item, i) => (
            <details key={i} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-ink">
                {item.pergunta}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line font-sans text-xl leading-none text-ink transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="mt-3 max-w-[60ch] space-y-2 text-sm leading-relaxed text-ink-soft">
                <TextoRico texto={item.resposta} whatsappNumero={site.whatsappNumero} nome={site.nome} />
              </div>
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
