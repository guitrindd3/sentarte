import type { Metadata } from "next";
import { ModeloCard } from "@/components/modelo-card";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";
import { BOHO_NOME } from "@/lib/boho-model";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cadeiras boho",
  description: "Estampas boho exclusivas, em tons terrosos — cada padrão é uma trama diferente.",
};

export default async function BohoPage() {
  const content = await getContent();
  const cadeiras = content.categorias.find((c) => c.slug === "cadeiras");
  const modelo = cadeiras?.modelos.find((m) => m.nome === BOHO_NOME);

  return (
    <>
      <PageHeader
        titulo="Cadeiras boho"
        resumo="Estampas boho exclusivas, em tons terrosos — cada padrão é uma trama diferente. Escolha a sua cor preferida."
      />
      <section className="mx-auto max-w-md px-6 py-14">
        {modelo && cadeiras ? (
          <ModeloCard
            modelo={modelo}
            categoria={cadeiras.titulo}
            categoriaSlug={cadeiras.slug}
            whatsappNumero={content.site.whatsappNumero}
          />
        ) : (
          <p className="text-sm text-ink-soft">Nenhuma cadeira boho cadastrada ainda.</p>
        )}
      </section>
    </>
  );
}
