"use client";

import { useState } from "react";
import Image from "next/image";
import { Estrelas } from "@/components/estrelas";
import type { Depoimento } from "@/lib/content-schema";

// "Fotos de clientes" (2026-10-19): the photos customers sent with their
// review (approved in /admin → Depoimentos), big, tap to enlarge. Renders
// nothing until there is at least one.
export function FotosClientes({ depoimentos, titulo = "Fotos de clientes" }: { depoimentos: Depoimento[]; titulo?: string }) {
  const fotos = depoimentos.filter((d): d is Depoimento & { fotoUrl: string } => Boolean(d.fotoUrl)).slice(-12).reverse();
  const [aberta, setAberta] = useState<number | null>(null);
  if (!fotos.length) return null;
  const atual = aberta === null ? null : fotos[aberta];

  return (
    <section className="px-6 pt-14 md:pt-20" aria-labelledby="titulo-fotos-clientes">
      <div className="mx-auto max-w-6xl">
        <h2 id="titulo-fotos-clientes" className="font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">
          {titulo}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">Quem já recebeu a sua e mandou foto pra gente.</p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {fotos.map((d, i) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setAberta(i)}
                className="group relative block aspect-square w-full overflow-hidden border border-line bg-canvas text-left"
                aria-label={`Ver a foto de ${d.nome}`}
              >
                <Image src={d.fotoUrl} alt={`${d.nome} com a cadeira SentArte`} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(min-width: 768px) 25vw, 50vw" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/60 to-transparent px-3 pb-2 pt-8 text-xs text-canvas">
                  {d.nome}
                  {d.cidade ? `, ${d.cidade}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {atual ? (
        <div role="dialog" aria-modal="true" aria-label={`Foto de ${atual.nome}`} className="fixed inset-0 z-50 flex flex-col bg-ink/90 p-4 sm:p-10" onClick={() => setAberta(null)}>
          <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
            <Image src={atual.fotoUrl} alt={`${atual.nome} com a cadeira SentArte`} fill className="object-contain" sizes="100vw" />
          </div>
          <div className="mx-auto mt-4 max-w-xl text-center text-canvas" onClick={(e) => e.stopPropagation()}>
            {atual.estrelas ? <Estrelas valor={atual.estrelas} tamanho="h-4 w-4" /> : null}
            <p className="mt-1">&ldquo;{atual.texto}&rdquo;</p>
            <p className="mt-1 text-sm text-canvas/70">
              {atual.nome}
              {atual.cidade ? `, ${atual.cidade}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAberta(null)}
            className="absolute right-3 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] flex h-10 w-10 items-center justify-center rounded-full border border-canvas/40 text-2xl leading-none text-canvas"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      ) : null}
    </section>
  );
}
