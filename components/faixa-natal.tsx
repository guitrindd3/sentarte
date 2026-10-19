"use client";

import { useEffect, useState, type ReactNode } from "react";

// Top strips (2026-10-19: Natal, then Réveillon, then janeiro). Only one shows
// at a time: the first whose deadline (`ate`, YYYY-MM-DD, Brasília) hasn't
// passed. The pages are cached, so the date check runs in the browser.
export function FaixaNatal({ faixas }: { faixas: { ate: string; conteudo: ReactNode }[] }) {
  const [hoje, setHoje] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHoje(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()));
  }, []);
  const ordenadas = [...faixas].sort((a, b) => a.ate.localeCompare(b.ate));
  // Before hydration show the earliest one (what the cached HTML had); then the right one for today.
  const atual = hoje === null ? ordenadas[0] : ordenadas.find((f) => f.ate >= hoje);
  if (!atual) return null;
  return (
    <div className="relative z-50 bg-espresso px-4 py-2 text-center text-xs text-canvas sm:text-sm [&_a]:font-medium [&_a]:!text-canvas [&_a]:underline [&_a]:underline-offset-2">
      {atual.conteudo}
    </div>
  );
}
