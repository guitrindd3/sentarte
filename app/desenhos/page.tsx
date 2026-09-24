import type { Metadata } from "next";
import { ModeloCard } from "@/components/modelo-card";
import { PageHeader } from "@/components/page-header";
import { getContent } from "@/lib/content-store";
import { DESENHO_TEMAS } from "@/lib/desenho-model";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Desenho, anime e frases",
  description: "Desenhos, personagens e frases tecidos na cadeira — cada peça é feita sob encomenda.",
};

export default async function DesenhosPage() {
  const content = await getContent();
  const cadeiras = content.categorias.find((c) => c.slug === "cadeiras");
  const modelos = cadeiras
    ? DESENHO_TEMAS.flatMap((nome) => {
        const modelo = cadeiras.modelos.find((m) => m.nome === nome);
        return modelo ? [modelo] : [];
      })
    : [];

  return (
    <>
      <PageHeader
        titulo="Desenho, anime e frases"
        resumo="Desenhos, personagens e frases tecidos na cadeira. Os exemplos abaixo são pedidos que já fizemos — conta pra gente o que você tem em mente e a gente tece."
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
          <p className="text-sm text-ink-soft">Nenhum exemplo cadastrado ainda.</p>
        )}
      </section>
    </>
  );
}
