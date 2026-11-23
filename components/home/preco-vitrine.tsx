"use client";

import { formatBRL, precoPix } from "@/lib/offer";
import { precoBlackFriday, useBlackFriday } from "@/lib/use-black-friday";
import { LogoBlackFriday } from "@/components/logo-black-friday";
import { LacoNatal, PrecoNatal } from "@/components/natal";
import { FitaAnoNovo } from "@/components/ano-novo";

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
      {final === preco ? <PrecoNatal preco={preco} className="mt-0.5" /> : null}
    </>
  );
}

/** Seasonal decorations over a "Novidades" photo, same as ModeloCard: Black Friday logo, else the Christmas bow / New Year ribbon. */
export function EnfeitesDaFoto({ grande = false }: { grande?: boolean }) {
  const bf = useBlackFriday();
  if (bf) return <LogoBlackFriday className={grande ? "w-[30%]" : "w-[42%]"} />;
  return (
    <>
      <LacoNatal />
      <FitaAnoNovo />
    </>
  );
}
