"use client";

import { useEffect, useState } from "react";
import { CODIGO_BLACK_FRIDAY, hojeBR, semanaDaBlackFriday } from "./black-friday";
import type { CupomPublico } from "./cupom";

// One request per page view, shared by every card that asks (the cart asks
// /api/cupom anyway). The server decides whether it's Black Friday (week +
// early start set in the admin), so logo/prices/notice end exactly with it.
let pedido: Promise<CupomPublico | null> | null = null;

/** The live BLACKFRIDAY coupon (percent, minimum) and when the week ends, or null. */
export function useBlackFriday() {
  const [bf, setBf] = useState<{ cupom: CupomPublico; fimMs: number } | null>(null);
  useEffect(() => {
    pedido ??= fetch("/api/cupom", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { automaticos?: CupomPublico[] }) => j.automaticos?.find((c) => c.codigo === CODIGO_BLACK_FRIDAY) ?? null)
      .catch(() => null);
    let vivo = true;
    pedido.then((cupom) => vivo && cupom && setBf({ cupom, fimMs: semanaDaBlackFriday(Number(hojeBR().slice(0, 4))).fimMs }));
    return () => {
      vivo = false;
    };
  }, []);
  return bf;
}

/** Chair price with the Black Friday percent off (only when it applies to a single chair). */
export const precoBlackFriday = (preco: number, bf: { cupom: CupomPublico } | null) =>
  bf && bf.cupom.minCadeiras <= 1 ? Math.round(preco * (1 - bf.cupom.valor / 100) * 100) / 100 : null;
