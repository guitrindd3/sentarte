"use client";

import Link from "next/link";
import { CompartilharIcon, CoracaoIcon } from "@/components/icons";
import { ModeloCard } from "@/components/modelo-card";
import { useFavoritos } from "@/lib/favoritos";
import { SITE_URL } from "@/lib/nav";
import type { Modelo } from "@/lib/content-schema";

type ProdutoLista = { slug: string; base: Modelo; personalizado?: Modelo; categoria: string; categoriaSlug: string };

export function ListaFavoritos({ produtos, whatsappNumero }: { produtos: ProdutoLista[]; whatsappNumero: string }) {
  const { lista } = useFavoritos();
  const salvos = lista.flatMap((slug) => produtos.filter((p) => p.slug === slug));

  if (!salvos.length) {
    return (
      <div className="mx-auto max-w-md border border-line bg-paper p-8 text-center">
        <CoracaoIcon className="mx-auto h-8 w-8 text-ink-soft" />
        <p className="mt-3 font-serif text-xl font-medium tracking-tight text-ink">Nenhuma cadeira guardada ainda</p>
        <p className="mt-2 text-sm text-ink-soft">Toque no coração em cima da foto de uma cadeira para guardar e comparar depois.</p>
        <Link href="/categoria/cadeiras" className="mt-5 inline-block border border-ink bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink">
          Ver as cadeiras
        </Link>
      </div>
    );
  }

  const texto = ["As cadeiras que eu gostei na SentArte:", ...salvos.map((p) => `${p.base.nome}: ${SITE_URL}/cadeira/${p.slug}`)].join("\n");
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {salvos.length} {salvos.length === 1 ? "cadeira guardada" : "cadeiras guardadas"}
        </p>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noreferrer"
          data-rastro="Mandar favoritos no WhatsApp"
          className="inline-flex items-center gap-2 border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-ink"
        >
          <CompartilharIcon className="h-4 w-4" />
          Mandar a lista para alguém
        </a>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {salvos.map((p) => (
          <ModeloCard
            key={p.slug}
            modelo={p.base}
            personalizado={p.personalizado}
            categoria={p.categoria}
            categoriaSlug={p.categoriaSlug}
            whatsappNumero={whatsappNumero}
          />
        ))}
      </div>
    </>
  );
}
