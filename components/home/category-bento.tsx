import Link from "next/link";
import { WeavePattern } from "@/components/weave-pattern";

const TILES = [
  {
    slug: "cadeiras",
    titulo: "Cadeiras de praia",
    resumo: "Personalizadas, de time ou em tramas exclusivas.",
    colorA: "#15564C",
    colorB: "#EDE3D0",
    span: "md:col-span-2",
    tone: "bg-canvas-deep text-ink",
  },
  {
    slug: "bolsas",
    titulo: "Bolsas",
    resumo: "No mesmo trançado das cadeiras, para levar tudo pra praia.",
    colorA: "#A9835A",
    colorB: "#16222B",
    span: "",
    tone: "bg-navy text-canvas",
  },
  {
    slug: "espreguicadeiras",
    titulo: "Espreguiçadeiras",
    resumo: "Para quem não abre mão do conforto.",
    colorA: "#BD502E",
    colorB: "#EDE3D0",
    span: "",
    tone: "bg-canvas-deep text-ink",
  },
] as const;

export function CategoryBento() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="font-serif text-2xl text-ink">O que trançamos</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {TILES.map((tile) => (
          <Link
            key={tile.slug}
            href={`/categoria/${tile.slug}`}
            className={`group relative flex min-h-[220px] flex-col justify-between overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 ${tile.tone} ${tile.span}`}
          >
            <WeavePattern
              colorA={tile.colorA}
              colorB={tile.colorB}
              cell={28}
              band={19}
              className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 opacity-25 transition-opacity group-hover:opacity-40"
            />
            <span className="relative font-serif text-xl">{tile.titulo}</span>
            <span className="relative max-w-[28ch] text-sm opacity-80">{tile.resumo}</span>
            <span className="relative mt-2 inline-block w-fit border-b border-current text-xs">
              Ver modelos
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
