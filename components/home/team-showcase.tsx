import { ModeloCard } from "@/components/modelo-card";
import type { Categoria, Modelo } from "@/lib/content-schema";

// Curated by name, not stored as a flag in the schema — these are the real
// team chairs uploaded via /admin on 2026-09-21. If a team model gets
// renamed or removed in the admin, update this list to match.
const TIMES = ["Flamengo", "Corinthians", "Botafogo", "Fluminense", "Palmeiras", "Vasco"];

export function TeamShowcase({
  categorias,
  whatsappNumero,
}: {
  categorias: Categoria[];
  whatsappNumero: string;
}) {
  const cadeiras = categorias.find((c) => c.slug === "cadeiras");
  if (!cadeiras) return null;

  const times = TIMES.flatMap((nome) => {
    const base = cadeiras.modelos.find((m) => m.nome === nome);
    if (!base) return [];
    const personalizado = cadeiras.modelos.find((m) => m.nome === `${nome} personalizado`);
    return [{ base, personalizado }];
  });

  if (times.length === 0) return null;

  return (
    <section className="border-t border-line px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">Cadeiras de time</h2>
        <p className="mt-2 max-w-[60ch] text-sm text-ink-soft">
          As cores e o escudo do seu time, trançados direto na estrutura — sem adesivo, sem
          estampa. Também personalizamos com um nome no encosto.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {times.map(({ base, personalizado }: { base: Modelo; personalizado?: Modelo }) => (
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
      </div>
    </section>
  );
}
