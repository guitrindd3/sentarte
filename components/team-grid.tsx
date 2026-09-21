import { ModeloCard } from "@/components/modelo-card";
import { getTeamPairs } from "@/lib/team-models";
import type { Categoria } from "@/lib/content-schema";

export function TeamGrid({
  categorias,
  whatsappNumero,
}: {
  categorias: Categoria[];
  whatsappNumero: string;
}) {
  const cadeiras = categorias.find((c) => c.slug === "cadeiras");
  const times = getTeamPairs(categorias);
  if (!cadeiras || times.length === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
