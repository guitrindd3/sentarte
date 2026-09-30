import { AutoScrollRow } from "@/components/auto-scroll-row";
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
  /** On phones, a self-scrolling looping row instead of a stacked grid (homepage). */
  deslizar?: boolean;
}) {
  const cadeiras = categorias.find((c) => c.slug === "cadeiras");
  const times = getTeamPairs(categorias);
  if (!cadeiras || times.length === 0) return null;

  const cartoes = times.map(({ base, personalizado }) => (
    <ModeloCard
      key={base.id}
      modelo={base}
      personalizado={personalizado}
      categoria={cadeiras.titulo}
      categoriaSlug={cadeiras.slug}
      whatsappNumero={whatsappNumero}
    />
  ));

  if (!deslizar) return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{cartoes}</div>;

  return (
    <AutoScrollRow className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden [&>*]:w-[82%] [&>*]:shrink-0 sm:[&>*]:w-auto">
      {cartoes}
      {/* Second copy for the seamless loop — phones only, not focusable. */}
      {times.map(({ base, personalizado }, i) => (
        <div key={`copia-${base.id}`} inert aria-hidden="true" data-loop-start={i === 0 ? "" : undefined} className="sm:hidden">
          <ModeloCard
            modelo={base}
            personalizado={personalizado}
            categoria={cadeiras.titulo}
            categoriaSlug={cadeiras.slug}
            whatsappNumero={whatsappNumero}
          />
        </div>
      ))}
    </AutoScrollRow>
  );
}
