import { Carousel } from "@/components/home/carousel";
import { CategoryBento } from "@/components/home/category-bento";
import { ContactCta } from "@/components/home/contact-cta";
import { Depoimentos } from "@/components/home/depoimentos";
import { MaterialSpec } from "@/components/home/material-spec";
import { PersonalizationSteps } from "@/components/home/personalization-steps";
import { PullQuote } from "@/components/home/pull-quote";
import { TeamShowcase } from "@/components/home/team-showcase";
import type { Metadata } from "next";
import { OfferStrip } from "@/components/offer-strip";
import { getContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const content = await getContent();

  return (
    <>
      <Carousel hero={content.hero} whatsappNumero={content.site.whatsappNumero} />
      <OfferStrip />
      <CategoryBento categorias={content.categorias} />
      <TeamShowcase categorias={content.categorias} whatsappNumero={content.site.whatsappNumero} />
      <PersonalizationSteps />
      <Depoimentos depoimentos={content.depoimentos} />
      <PullQuote />
      <MaterialSpec />
      <ContactCta whatsappNumero={content.site.whatsappNumero} instagramHandle={content.site.instagramHandle} />
    </>
  );
}
