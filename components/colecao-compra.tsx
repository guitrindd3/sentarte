"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { dataHora, useColecaoDoModelo } from "@/lib/use-colecoes";

/** "Edição numerada · restam 12 de 40" on chairs of a numbered collection (lib/colecoes.ts). */
export function SeloColecao({ nome, className = "" }: { nome: string; className?: string }) {
  const c = useColecaoDoModelo(nome);
  if (!c) return null;
  return (
    <Link
      href={`/colecao/${c.id}`}
      className={`inline-flex w-fit items-center gap-1.5 border border-ink px-2 py-1 text-xs text-ink hover:bg-ink hover:text-canvas ${className}`}
    >
      <span className="font-semibold">{c.nome}</span>
      <span aria-hidden>·</span>
      {c.situacao === "esgotada"
        ? "esgotada"
        : c.situacao === "espera"
          ? `${c.total} numeradas`
          : `restam ${c.restam} de ${c.total}`}
    </Link>
  );
}

/**
 * Wraps the buy buttons: a chair of a collection that hasn't opened yet or is
 * sold out shows the way to the waiting list instead. The checkout refuses it
 * anyway (lib/colecoes.ts conferirColecoes).
 */
export function PortaoColecao({ nome, children }: { nome: string; children: ReactNode }) {
  const c = useColecaoDoModelo(nome);
  if (!c || c.situacao === "aberta") return <>{children}</>;
  return (
    <div className="mt-4 space-y-1.5">
      <Link
        href={`/colecao/${c.id}#espera`}
        data-rastro={`Lista de espera (cartão): ${c.nome}`}
        className="inline-flex w-full items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink"
      >
        {c.situacao === "esgotada" ? "Esgotada: avise-me da próxima" : "Entrar na lista de espera"}
      </Link>
      <p className="text-xs text-ink-soft">
        {c.situacao === "esgotada"
          ? `As ${c.total} cadeiras da ${c.nome} já têm dono.`
          : c.abreEm
            ? `A ${c.nome} abre ${dataHora(c.abreEm)}.`
            : `A ${c.nome} abre em breve.`}
      </p>
    </div>
  );
}
