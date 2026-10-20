"use client";

import { useEffect, useState, type ReactNode } from "react";

// Top strip (2026-10-20: a yearly calendar, lib/faixas-calendario.ts). Only
// one shows at a time: the one whose window (inicio..ate, YYYY-MM-DD,
// Brasília) holds today. The pages are cached, so the date check runs in the
// browser; `hojeServidor` (the render date) picks it before hydration.
export function FaixaNatal({
  faixas,
  hojeServidor,
}: {
  faixas: { inicio: string; ate: string; conteudo: ReactNode }[];
  hojeServidor: string;
}) {
  const [hoje, setHoje] = useState(hojeServidor);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHoje(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()));
  }, []);
  const atual = faixas.find((f) => f.inicio <= hoje && f.ate >= hoje);
  if (!atual) return null;
  return (
    <div className="relative z-50 bg-espresso px-4 py-2 text-center text-xs text-canvas sm:text-sm [&_a]:font-medium [&_a]:!text-canvas [&_a]:underline [&_a]:underline-offset-2">
      {atual.conteudo}
    </div>
  );
}
