import Link from "next/link";
import { WeavePattern } from "@/components/weave-pattern";
import type { Categoria } from "@/lib/content-schema";

const TONES = ["bg-canvas-deep text-ink", "bg-navy text-canvas"];

export function CategoryBento({ categorias }: { categorias: Categoria[] }) {
  if (categorias.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="font-serif text-2xl text-ink">O que trançamos</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categorias.map((cat, i) => (
          <Link
            key={cat.id}
            href={`/categoria/${cat.slug}`}
            className={`group relative flex min-h-[220px] flex-col justify-between overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 ${TONES[i % TONES.length]}`}
          >
            <WeavePattern
              colorA={cat.corA}
              colorB={cat.corB}
              cell={28}
              band={19}
              className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 opacity-25 transition-opacity group-hover:opacity-40"
            />
            <span className="relative font-serif text-xl">{cat.titulo}</span>
            <span className="relative max-w-[28ch] text-sm opacity-80">{cat.resumo}</span>
            <span className="relative mt-2 inline-block w-fit border-b border-current text-xs">
              Ver modelos
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
