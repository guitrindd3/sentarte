import type { Metadata } from "next";
import { chairListJsonLd, pageMetadata } from "@/lib/seo";
import { getTeamPairs } from "@/lib/team-models";
import { JsonLd } from "@/components/json-ld";
import { OfferStrip } from "@/components/offer-strip";
import { PageHeader } from "@/components/page-header";
import { TeamGrid } from "@/components/team-grid";
import { getContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Cadeira de praia de time personalizada",
  description:
    "Cadeira de praia do seu time trançada à mão, nas cores do Flamengo, Vasco, Botafogo, Fluminense, Corinthians ou Palmeiras, com ou sem o seu nome. A partir de R$ 449,90, frete grátis para todo o Brasil.",
  path: "/times",
});

export default async function TimesPage() {
  const content = await getContent();

  return (
    <>
      <PageHeader
        voltarPara="/categoria/cadeiras"
        titulo="Cadeiras de time"
        resumo="As cores e o escudo do seu time, trançados direto na estrutura — sem adesivo, sem estampa. Escolha com ou sem um nome no encosto."
      />
      <OfferStrip compact />
      <JsonLd data={chairListJsonLd(getTeamPairs(content.categorias).map((t) => t.base))} />
      <section className="mx-auto max-w-6xl px-6 py-14">
        <TeamGrid categorias={content.categorias} whatsappNumero={content.site.whatsappNumero} />
      </section>
    </>
  );
}
