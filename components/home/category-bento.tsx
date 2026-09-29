import Link from "next/link";
import { CoverLinkCard, VIDEO_MONTE_SUA_CADEIRA } from "@/components/cover-link-card";
import { BOHO_NOME } from "@/lib/boho-model";
import { DESENHO_NOME } from "@/lib/desenho-model";
import { TIME_DO_CORACAO_NOME } from "@/lib/team-models";
import type { Categoria } from "@/lib/content-schema";

// The homepage's entry points into the catalog. Since bags and lounge chairs
// were taken off the site (2026-09-29) there is only one category, so this
// shows its collections instead — reusing each collection's cover model
// (the same ones the category grid shows via CoverLinkCard).
const COLECOES = [
  { nome: TIME_DO_CORACAO_NOME, href: "/times", linkLabel: "Ver os times" },
  { nome: BOHO_NOME, href: "/boho", linkLabel: "Ver as estampas" },
  { nome: DESENHO_NOME, href: "/desenhos", linkLabel: "Ver os desenhos" },
  { nome: "Monte a sua trama", href: "/personalizar", linkLabel: "Montar a minha" },
];

export function CategoryBento({ categorias }: { categorias: Categoria[] }) {
  const cadeiras = categorias.find((c) => c.slug === "cadeiras");
  if (!cadeiras) return null;

  const cards = COLECOES.flatMap((colecao) => {
    const modelo = cadeiras.modelos.find((m) => m.nome === colecao.nome);
    return modelo ? [{ ...colecao, modelo }] : [];
  });
  if (cards.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">Escolha a sua cadeira</h2>
        <Link href="/categoria/cadeiras" className="shrink-0 border-b border-current text-sm font-medium text-ink">
          Ver todos os modelos
        </Link>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ modelo, href, linkLabel }) => (
          <CoverLinkCard
            key={modelo.id}
            modelo={modelo}
            href={href}
            linkLabel={linkLabel}
            shape={href === "/personalizar" ? "espiral" : undefined}
            videoUrl={href === "/personalizar" ? VIDEO_MONTE_SUA_CADEIRA : undefined}
          />
        ))}
      </div>
    </section>
  );
}
