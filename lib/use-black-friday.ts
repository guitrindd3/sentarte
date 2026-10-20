"use client";

import { useEffect, useState } from "react";
import { CODIGO_BLACK_FRIDAY, hojeBR, naBlackFriday } from "./black-friday";
import type { CupomPublico } from "./cupom";

// One request per page view, shared by every card that asks (and only during
// Black Friday week — other weeks nothing is fetched).
let pedido: Promise<CupomPublico | null> | null = null;

/** The live BLACKFRIDAY coupon (percent, minimum) and when the week ends, or null. */
export function useBlackFriday() {
  const [bf, setBf] = useState<{ cupom: CupomPublico; fimMs: number } | null>(null);
  useEffect(() => {
    const semana = naBlackFriday(hojeBR());
    if (!semana) return;
    pedido ??= fetch("/api/cupom", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { automaticos?: CupomPublico[] }) => j.automaticos?.find((c) => c.codigo === CODIGO_BLACK_FRIDAY) ?? null)
      .catch(() => null);
    let vivo = true;
    pedido.then((cupom) => vivo && cupom && setBf({ cupom, fimMs: semana.fimMs }));
    return () => {
      vivo = false;
    };
  }, []);
  return bf;
}

/** Chair price with the Black Friday percent off (only when it applies to a single chair). */
export const precoBlackFriday = (preco: number, bf: { cupom: CupomPublico } | null) =>
  bf && bf.cupom.minCadeiras <= 1 ? Math.round(preco * (1 - bf.cupom.valor / 100) * 100) / 100 : null;
