"use client";

import { formatBRL, precoPix } from "@/lib/offer";
import { precoBlackFriday, useBlackFriday } from "@/lib/use-black-friday";

/** Price line on the homepage "Novidades" cards — struck old price while Black Friday is on. */
export function PrecoVitrine({ preco, grande = false }: { preco: number; grande?: boolean }) {
  const bf = useBlackFriday();
  const final = precoBlackFriday(preco, bf) ?? preco;
  return (
    <>
      <span className={`mt-1 block text-ink ${grande ? "text-base" : "text-sm"}`}>
        {final !== preco ? <s className="mr-1.5 text-ink-soft">{formatBRL(preco)}</s> : null}
        <span className={final !== preco ? "font-semibold" : ""}>{formatBRL(final)}</span>
      </span>
      <span className="block text-xs text-ink-soft">{formatBRL(precoPix(final))} no Pix</span>
    </>
  );
}
