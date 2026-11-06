"use client";

import Link from "next/link";
import { dataHora, useColecoes } from "@/lib/use-colecoes";

/**
 * Homepage band for a numbered collection that is open or about to open
 * (lib/colecoes.ts). Client-side: the homepage stays cached, the count is live.
 */
export function ColecaoDestaque() {
  const c = useColecoes()?.find((x) => x.situacao === "aberta" || x.situacao === "espera");
  if (!c) return null;
  const aberta = c.situacao === "aberta";
  return (
    <section className="bg-ink text-canvas">
      <Link
        href={`/colecao/${c.id}`}
        data-rastro={`Faixa da coleção: ${c.nome}`}
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-6 hover:opacity-90"
      >
        <div>
          <p className="text-xs tracking-wide text-canvas/70">Edição numerada · só {c.total} cadeiras</p>
          <p className="font-serif text-2xl font-medium tracking-tight md:text-3xl">{c.nome}</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-canvas/85">
            {aberta ? (
              <>
                <strong className="font-semibold text-canvas">{c.restam === 1 ? "Resta 1" : `Restam ${c.restam}`}</strong> de {c.total}
              </>
            ) : c.abreEm ? (
              `Abre ${dataHora(c.abreEm)}`
            ) : (
              "Abre em breve"
            )}
          </p>
          <span className="inline-flex items-center bg-canvas px-4 py-2 text-sm font-semibold text-ink">{aberta ? "Ver a coleção" : "Entrar na lista"}</span>
        </div>
      </Link>
    </section>
  );
}
