import { ModeloCard } from "@/components/modelo-card";
import { getTeamPairs } from "@/lib/team-models";
import type { Categoria } from "@/lib/content-schema";

export function TeamGrid({
  categorias,
  whatsappNumero,
  deslizar = false,
}: {
  categorias: Categoria[];
  whatsappNumero: string;
  /** On phones, a sideways-swipe row instead of a stacked grid (homepage). */
  deslizar?: boolean;
}) {
  const cadeiras = categorias.find((c) => c.slug === "cadeiras");
  const times = getTeamPairs(categorias);
  if (!cadeiras || times.length === 0) return null;

  return (
    <div
      className={
        deslizar
          ? "-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-3 [&>*]:w-[82%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto"
          : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {times.map(({ base, personalizado }) => (
        <ModeloCard
          key={base.id}
          modelo={base}
          personalizado={personalizado}
          categoria={cadeiras.titulo}
          categoriaSlug={cadeiras.slug}
          whatsappNumero={whatsappNumero}
        />
      ))}
    </div>
  );
}
