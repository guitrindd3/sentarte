import Link from "next/link";
import { TeamGrid } from "@/components/team-grid";
import { getTeamPairs } from "@/lib/team-models";
import type { Categoria } from "@/lib/content-schema";

export function TeamShowcase({
  categorias,
  whatsappNumero,
}: {
  categorias: Categoria[];
  whatsappNumero: string;
}) {
  if (getTeamPairs(categorias).length === 0) return null;

  return (
    <section className="border-t border-line px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">Cadeiras de time</h2>
            <p className="mt-2 max-w-[60ch] text-sm text-ink-soft">
              As cores e o escudo do seu time, trançados direto na estrutura — sem adesivo, sem
              estampa. Também personalizamos com um nome no encosto.
            </p>
          </div>
          <Link href="/times" className="shrink-0 border-b border-current text-sm font-medium text-ink">
            Ver todos os times
          </Link>
        </div>
        <div className="mt-8">
          <TeamGrid categorias={categorias} whatsappNumero={whatsappNumero} />
        </div>
      </div>
    </section>
  );
}
