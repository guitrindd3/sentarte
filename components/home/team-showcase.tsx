import { ModeloCard } from "@/components/modelo-card";
import type { Categoria } from "@/lib/content-schema";

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

  const times = TIMES.map((nome) => cadeiras.modelos.find((m) => m.nome === nome)).filter(
    (m): m is NonNullable<typeof m> => Boolean(m)
  );

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
          {times.map((modelo) => (
            <ModeloCard
              key={modelo.id}
              modelo={modelo}
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
