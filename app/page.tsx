import { CategoryBento } from "@/components/home/category-bento";
import { Configurator } from "@/components/home/configurator";
import { ContactCta } from "@/components/home/contact-cta";
import { Hero } from "@/components/home/hero";
import { MaterialSpec } from "@/components/home/material-spec";
import { PersonalizationSteps } from "@/components/home/personalization-steps";
import { PullQuote } from "@/components/home/pull-quote";

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryBento />
      <PersonalizationSteps />
      <Configurator />
      <PullQuote />
      <MaterialSpec />
      <ContactCta />
    </>
  );
}
