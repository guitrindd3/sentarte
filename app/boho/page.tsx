import type { Metadata } from "next";
import { ModeloCard } from "@/components/modelo-card";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";
import { BOHO_PADROES } from "@/lib/boho-model";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cadeiras boho",
  description: "Estampas boho exclusivas, em tons terrosos — cada padrão é uma trama diferente.",
};

export default async function BohoPage() {
  const content = await getContent();
  const cadeiras = content.categorias.find((c) => c.slug === "cadeiras");
  const modelos = cadeiras
    ? BOHO_PADROES.flatMap((nome) => {
        const modelo = cadeiras.modelos.find((m) => m.nome === nome);
        return modelo ? [modelo] : [];
      })
    : [];

  return (
    <>
      <PageHeader
        titulo="Cadeiras boho"
        resumo="Estampas boho exclusivas, em tons terrosos — cada padrão é uma trama diferente."
      />
      <section className="mx-auto max-w-6xl px-6 py-14">
        {modelos.length > 0 && cadeiras ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modelos.map((modelo) => (
              <ModeloCard
                key={modelo.id}
                modelo={modelo}
                categoria={cadeiras.titulo}
                categoriaSlug={cadeiras.slug}
                whatsappNumero={content.site.whatsappNumero}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">Nenhuma estampa boho cadastrada ainda.</p>
        )}
      </section>
    </>
  );
}
