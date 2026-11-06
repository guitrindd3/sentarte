"use client";

import { useEffect, useState } from "react";
import type { ColecaoPublica } from "./colecoes";

// One /api/colecoes request per page view, shared by every card that asks
// (same idea as lib/use-black-friday.ts). Pages stay cached; the numbers left
// come live.

export type ColecaoNoSite = Omit<ColecaoPublica, "descricao">;

let pedido: Promise<ColecaoNoSite[]> | null = null;

export function useColecoes() {
  const [lista, setLista] = useState<ColecaoNoSite[] | null>(null);
  useEffect(() => {
    pedido ??= fetch("/api/colecoes")
      .then((r) => r.json())
      .then((j: { colecoes?: ColecaoNoSite[] }) => j.colecoes ?? [])
      .catch(() => []);
    let vivo = true;
    pedido.then((l) => vivo && setLista(l));
    return () => {
      vivo = false;
    };
  }, []);
  return lista;
}

/** The (not closed) collection a catalog chair belongs to, if any. */
export function useColecaoDoModelo(nome: string) {
  const lista = useColecoes();
  return lista?.find((c) => c.situacao !== "encerrada" && c.modelos.includes(nome)) ?? null;
}

export const dataHora = (ms: number) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })
    .format(new Date(ms))
    .replace(",", " às");
