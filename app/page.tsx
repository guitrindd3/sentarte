import { Carousel } from "@/components/home/carousel";
import { CategoryBento } from "@/components/home/category-bento";
import { Configurator } from "@/components/home/configurator";
import { ContactCta } from "@/components/home/contact-cta";
import { MaterialSpec } from "@/components/home/material-spec";
import { PersonalizationSteps } from "@/components/home/personalization-steps";
import { PullQuote } from "@/components/home/pull-quote";
import { getContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getContent();

  return (
    <>
      <Carousel hero={content.hero} whatsappNumero={content.site.whatsappNumero} />
      <CategoryBento categorias={content.categorias} />
      <PersonalizationSteps />
      <Configurator categorias={content.categorias} whatsappNumero={content.site.whatsappNumero} />
      <PullQuote />
      <MaterialSpec />
      <ContactCta whatsappNumero={content.site.whatsappNumero} instagramHandle={content.site.instagramHandle} />
    </>
  );
}
