"use client";

import { useCallback, useSyncExternalStore } from "react";

// Favorite chairs (2026-10-19): a list of product slugs kept only in this
// browser (no account). Every heart and the header counter read the same
// store, so they update together.

const KEY = "sentarte-favoritos";
const EVENTO = "sentarte-favoritos";
const VAZIO: string[] = [];
let cache: { bruto: string | null; lista: string[] } = { bruto: null, lista: VAZIO };

function ler(): string[] {
  let bruto: string | null = null;
  try {
    bruto = window.localStorage.getItem(KEY);
  } catch {}
  if (bruto === cache.bruto) return cache.lista;
  let lista = VAZIO;
  try {
    const v = JSON.parse(bruto ?? "[]");
    if (Array.isArray(v)) lista = v.filter((x): x is string => typeof x === "string").slice(0, 100);
  } catch {}
  cache = { bruto, lista };
  return lista;
}

function assinar(avisar: () => void) {
  window.addEventListener(EVENTO, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO, avisar);
    window.removeEventListener("storage", avisar);
  };
}

export function useFavoritos() {
  const lista = useSyncExternalStore(assinar, ler, () => VAZIO);
  const alternar = useCallback((slug: string) => {
    const atual = ler();
    const nova = atual.includes(slug) ? atual.filter((s) => s !== slug) : [slug, ...atual];
    try {
      window.localStorage.setItem(KEY, JSON.stringify(nova));
    } catch {}
    window.dispatchEvent(new Event(EVENTO));
  }, []);
  return { lista, ehFavorito: (slug: string) => lista.includes(slug), alternar };
}
