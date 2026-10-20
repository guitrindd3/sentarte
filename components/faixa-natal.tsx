"use client";

import { useEffect, useState, type ReactNode } from "react";
import { naBlackFriday } from "@/lib/black-friday";

// Top strip (2026-10-20: a yearly calendar, lib/faixas-calendario.ts). Only
// one shows at a time: the one whose window (inicio..ate, YYYY-MM-DD,
// Brasília) holds today — or, in Black Friday week, the Black Friday strip
// with a countdown (lib/black-friday.ts). The pages are cached, so the date
// check runs in the browser; `hojeServidor` (the render date) picks it before
// hydration.
export function FaixaNatal({
  faixas,
  hojeServidor,
  blackFriday,
}: {
  faixas: { inicio: string; ate: string; conteudo: ReactNode }[];
  hojeServidor: string;
  /** null when Black Friday is turned off in the admin */
  blackFriday: { conteudo: ReactNode; inicioAntecipado?: string } | null;
}) {
  const [hoje, setHoje] = useState(hojeServidor);
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    const tique = () => {
      setHoje(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()));
      setAgora(Date.now());
    };
    tique();
    const t = setInterval(tique, 30_000);
    return () => clearInterval(t);
  }, []);

  const semana = blackFriday ? naBlackFriday(hoje, blackFriday.inicioAntecipado) : null;
  if (semana && blackFriday) {
    return (
      <div className="relative z-50 bg-ink px-4 py-2 text-center text-xs text-canvas sm:text-sm [&_a]:font-semibold [&_a]:!text-canvas [&_a]:underline [&_a]:underline-offset-2">
        {blackFriday.conteudo}
        {agora !== null && semana.fimMs > agora ? (
          <span className="ml-2 inline-block rounded-full border border-canvas/40 px-2 py-0.5 text-[0.7rem] font-semibold tabular-nums sm:text-xs">
            Termina em {faltam(semana.fimMs - agora)}
          </span>
        ) : null}
      </div>
    );
  }

  const atual = faixas.find((f) => f.inicio <= hoje && f.ate >= hoje);
  if (!atual) return null;
  return (
    <div className="relative z-50 bg-espresso px-4 py-2 text-center text-xs text-canvas sm:text-sm [&_a]:font-medium [&_a]:!text-canvas [&_a]:underline [&_a]:underline-offset-2">
      {atual.conteudo}
    </div>
  );
}

/** "3 dias e 5 h" / "5 h 12 min" / "12 min". */
function faltam(ms: number) {
  const min = Math.ceil(ms / 60_000);
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  if (d) return `${d} ${d === 1 ? "dia" : "dias"} e ${h} h`;
  if (h) return `${h} h ${m} min`;
  return `${m} min`;
}
