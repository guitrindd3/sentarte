import type { Metadata } from "next";
import { chairListJsonLd, pageMetadata } from "@/lib/seo";
import { getTeamPairs } from "@/lib/team-models";
import { JsonLd } from "@/components/json-ld";
import { OfferStrip } from "@/components/offer-strip";
import { PageHeader } from "@/components/page-header";
import { textoSimples } from "@/components/texto-rico";
import { textosDaPagina } from "@/lib/textos-paginas";
import { TeamGrid } from "@/components/team-grid";
import { getContent } from "@/lib/content-store";

// Pre-rendered and cached (2026-10-06, the site felt slow): rebuilt every 10 min
// at most, and right away when the admin saves (revalidatePath("/", "layout")).
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Cadeira de praia de time personalizada",
  description:
    "Cadeira de praia do seu time trançada à mão, nas cores do Flamengo, Vasco, Botafogo, Fluminense, Corinthians ou Palmeiras, com ou sem o seu nome. A partir de R$ 449,90, com envio para todo o Brasil.",
  path: "/times",
});

export default async function TimesPage() {
  const tp = textosDaPagina((await getContent()).paginas, "times");
  const content = await getContent();

  return (
    <>
      <PageHeader
        voltarPara="/categoria/cadeiras"
        titulo={textoSimples(tp.linha("titulo"))}
        resumo={textoSimples(tp.linha("resumo"))}
      />
      <OfferStrip compact />
      <JsonLd data={chairListJsonLd(getTeamPairs(content.categorias).map((t) => t.base))} />
      <section className="mx-auto max-w-6xl px-6 py-14">
        <TeamGrid categorias={content.categorias} whatsappNumero={content.site.whatsappNumero} />
      </section>
    </>
  );
}
