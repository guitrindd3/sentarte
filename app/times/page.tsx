import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { TeamGrid } from "@/components/team-grid";
import { getContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cadeiras de time",
  description: "As cores e o escudo do seu time, trançados à mão — com ou sem um nome no encosto.",
};

export default async function TimesPage() {
  const content = await getContent();

  return (
    <>
      <PageHeader
        titulo="Cadeiras de time"
        resumo="As cores e o escudo do seu time, trançados direto na estrutura — sem adesivo, sem estampa. Escolha com ou sem um nome no encosto."
      />
      <section className="mx-auto max-w-6xl px-6 py-14">
        <TeamGrid categorias={content.categorias} whatsappNumero={content.site.whatsappNumero} />
      </section>
    </>
  );
}
