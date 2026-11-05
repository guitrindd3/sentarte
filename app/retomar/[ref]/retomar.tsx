"use client";

import { useEffect } from "react";
import type { ItemGuardado } from "@/lib/clientes";

/** Puts the order's chairs (and typed coupon) back in this browser's cart, then opens it on the homepage. */
export function Retomar({ itens, cupom }: { itens: ItemGuardado[]; cupom?: string }) {
  useEffect(() => {
    try {
      window.localStorage.setItem("sentarte-cart", JSON.stringify(itens));
      if (cupom) window.localStorage.setItem("sentarte-cupom", cupom);
    } catch {}
    window.location.replace("/?carrinho=aberto");
  }, [itens, cupom]);
  return <p className="text-sm text-ink-soft" role="status">Colocando a sua cadeira de volta no carrinho…</p>;
}
