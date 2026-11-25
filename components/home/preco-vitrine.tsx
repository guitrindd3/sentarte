"use client";

import { formatBRL, PARCELAS_MAX, precoPix } from "@/lib/offer";
import { precoBlackFriday, useBlackFriday } from "@/lib/use-black-friday";
import { LogoBlackFriday } from "@/components/logo-black-friday";
import { EtiquetaCupomNatal, LacoNatal, PrecoNatal, useNatal } from "@/components/natal";
import { FitaAnoNovo } from "@/components/ano-novo";

/** Price block on the homepage "Novidades" cards — struck old price while Black Friday is on. */
export function PrecoVitrine({ preco, grande = false }: { preco: number; grande?: boolean }) {
  const bf = useBlackFriday();
  const final = precoBlackFriday(preco, bf) ?? preco;
  return (
    <>
      {final !== preco ? <s className="block text-xs text-ink-soft">{formatBRL(preco)}</s> : null}
      <span className={`block font-semibold tracking-tight text-ink ${grande ? "text-2xl md:text-3xl" : "text-lg sm:text-xl"}`}>
        {formatBRL(final)}
      </span>
      <span className="block text-xs text-ink-soft">
        {formatBRL(precoPix(final))} no Pix ou em até {PARCELAS_MAX}x no cartão
      </span>
      {final === preco ? <PrecoNatal preco={preco} className="mt-0.5" /> : null}
    </>
  );
}

/** Seasonal decorations over a "Novidades" photo, same as ModeloCard: Black Friday logo + % off, else the Christmas bow / New Year ribbon. */
export function EnfeitesDaFoto({ grande = false }: { grande?: boolean }) {
  const bf = useBlackFriday();
  if (bf) {
    return (
      <>
        <LogoBlackFriday className={grande ? "w-[30%]" : "w-[42%]"} />
        {bf.cupom.minCadeiras <= 1 && bf.cupom.tipo === "percentual" ? (
          <span className={`absolute bottom-3 left-3 bg-ink font-semibold text-canvas ${grande ? "px-3 py-1.5 text-base" : "px-2 py-1 text-xs"}`}>
            −{bf.cupom.valor}%
          </span>
        ) : null}
      </>
    );
  }
  return (
    <>
      <LacoNatal />
      <FitaAnoNovo />
    </>
  );
}

/** One line under the "Novidades" title with the offer of the moment (Black Friday, else Christmas), or nothing. */
export function ChamadaOferta() {
  const bf = useBlackFriday();
  const natal = useNatal();
  if (bf && bf.cupom.tipo === "percentual") {
    return (
      <p className="mt-4 inline-flex flex-wrap items-center gap-x-2 gap-y-1 bg-ink px-3 py-2 text-sm text-canvas">
        <span className="font-semibold">Black Friday:</span>
        <span>
          {bf.cupom.valor}% off {bf.cupom.minCadeiras <= 1 ? "em todas as cadeiras" : `a partir de ${bf.cupom.minCadeiras} cadeiras`}, já
          entra sozinho no carrinho
        </span>
      </p>
    );
  }
  if (natal) return <EtiquetaCupomNatal />;
  return null; // New Year: full-width band below the header (FaixaNovidadesAnoNovo)
}
