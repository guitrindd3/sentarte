import Link from "next/link";
import { AutoScrollRow } from "@/components/auto-scroll-row";
import { ModeloCard } from "@/components/modelo-card";
import { BOHO_PADROES } from "@/lib/boho-model";
import type { Categoria, Modelo } from "@/lib/content-schema";
import { DESENHO_TEMAS } from "@/lib/desenho-model";
import { getTeamPairs } from "@/lib/team-models";

// Homepage showcase of every chair on the site — teams, boho patterns and
// desenhos (user 2026-10-02: "todas as cadeiras do site, não só a de time").
// One row that drifts by itself and loops, on phones and desktop alike.
export function TeamShowcase({
  categorias,
  whatsappNumero,
}: {
  categorias: Categoria[];
  whatsappNumero: string;
}) {
  const cadeiras = categorias.find((c) => c.slug === "cadeiras");
  if (!cadeiras) return null;
  const porNome = (nome: string) => cadeiras.modelos.find((m) => m.nome === nome);
  const itens: { base: Modelo; personalizado?: Modelo }[] = [
    ...getTeamPairs(categorias),
    ...BOHO_PADROES.flatMap((n) => (porNome(n) ? [{ base: porNome(n)! }] : [])),
    ...DESENHO_TEMAS.flatMap((n) => (porNome(n) ? [{ base: porNome(n)! }] : [])),
  ];
  if (itens.length === 0) return null;

  const cartao = ({ base, personalizado }: (typeof itens)[number]) => (
    <ModeloCard
      modelo={base}
      personalizado={personalizado}
      categoria={cadeiras.titulo}
      categoriaSlug={cadeiras.slug}
      whatsappNumero={whatsappNumero}
    />
  );

  return (
    <section className="border-t border-line px-6 py-14 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">Nossas cadeiras</h2>
            <p className="mt-2 max-w-[60ch] text-sm text-ink-soft">
              De time, boho ou com o seu desenho preferido — todas trançadas à mão, e qualquer uma pode
              levar um nome no encosto.
            </p>
          </div>
          <Link href="/categoria/cadeiras" className="shrink-0 border-b border-current py-1 text-sm font-medium text-ink">
            Ver todos os modelos
          </Link>
        </div>
        <AutoScrollRow className="-mx-6 mt-8 flex gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:gap-6 [&::-webkit-scrollbar]:hidden [&>*]:w-[82%] [&>*]:shrink-0 sm:[&>*]:w-[45%] lg:[&>*]:w-[31%]">
          {itens.map((it) => (
            <div key={it.base.id}>{cartao(it)}</div>
          ))}
          {/* Second copy for the seamless loop — not focusable. */}
          {itens.map((it, i) => (
            <div key={`copia-${it.base.id}`} inert aria-hidden="true" data-loop-start={i === 0 ? "" : undefined}>
              {cartao(it)}
            </div>
          ))}
        </AutoScrollRow>
      </div>
    </section>
  );
}
