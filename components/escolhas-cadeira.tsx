"use client";

import type { ReactNode } from "react";
import { MEDIDAS_CADEIRAS, type ModeloMedidas } from "@/lib/medidas";
import { BRACO_MADEIRA, formatBRL, PARCELAS_MAX, precoCadeira, precoPix, TASSEL_PRECO, TIPOS_CADEIRA, type TipoCadeira } from "@/lib/offer";
import { precoBlackFriday, useBlackFriday } from "@/lib/use-black-friday";
import { PrecoNatal } from "@/components/natal";
import type { useEscolhaModelo } from "@/lib/use-escolha-modelo";

// Step-by-step chooser on the product page (user 2026-11-14: every chair can be
// infantil / normal / reclinável 8 posições, with prices, sizes, tassel and
// wooden arms, "melhore o design nessa parte"). Site look: square corners,
// ink = selected, no accent colors.

type Escolha = ReturnType<typeof useEscolhaModelo>;

export const ORDEM_TIPOS: TipoCadeira[] = ["infantil", "normal", "reclinavel"];
const MEDIDAS: Record<TipoCadeira, ModeloMedidas> = {
  infantil: MEDIDAS_CADEIRAS[0],
  normal: MEDIDAS_CADEIRAS[1],
  reclinavel: MEDIDAS_CADEIRAS[2],
};
const NOME_CURTO: Record<TipoCadeira, { nome: string; sub: string }> = {
  infantil: { nome: "Infantil", sub: "para crianças" },
  normal: { nome: "Normal", sub: "1 posição" },
  reclinavel: { nome: "Reclinável", sub: "8 posições" },
};

/** Numbered step title. */
export function Passo({ n, titulo, extra, children }: { n: number; titulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-[0.95rem] font-semibold text-ink">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-canvas">{n}</span>
          {titulo}
        </h2>
        {extra ? <span className="text-xs text-ink-soft">{extra}</span> : null}
      </div>
      {children}
    </section>
  );
}

/** Small line drawing of each chair size (the reclinável leans back). */
function Silhueta({ tipo, className = "" }: { tipo: TipoCadeira; className?: string }) {
  const encosto =
    tipo === "reclinavel" ? (
      <>
        <path d="M9 9 17 31" />
        <path d="M12 8.5 19.5 29M15 8 22 27.5" strokeWidth="0.9" opacity="0.55" />
        <path d="M9 9 15 8" />
      </>
    ) : (
      <>
        <path d="M15 8v23M15 8h14v13" />
        <path d="M19 8v13M23 8v13M27 8v13" strokeWidth="0.9" opacity="0.55" />
      </>
    );
  const desenho = (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {encosto}
      <path d="M15 31h19M17 31l-4 12M32 31l4 12M15 22h17" />
    </g>
  );
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {tipo === "infantil" ? <g transform="translate(6.7 12.3) scale(0.72)">{desenho}</g> : desenho}
    </svg>
  );
}

/** Step 1: the chair size, each with its price (with every other choice kept) and specs. */
export function EscolhaTamanho({ e }: { e: Escolha }) {
  const bf = useBlackFriday();
  const m = MEDIDAS[e.tipo];
  return (
    <>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tamanho da cadeira">
        {ORDEM_TIPOS.map((t) => {
          const on = e.tipo === t;
          const preco = e.precoNoTipo(t);
          const final = precoBlackFriday(preco, bf) ?? preco;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => e.setTipo(t)}
              data-rastro={`Tamanho: ${NOME_CURTO[t].nome}`}
              className={`relative flex flex-col items-center border px-1.5 py-2 text-center transition-colors sm:flex-row sm:gap-2 sm:px-2.5 sm:text-left ${
                on ? "border-ink bg-paper ring-1 ring-ink" : "border-line bg-paper/50 hover:border-ink"
              }`}
            >
              {on ? (
                <span aria-hidden className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-ink text-[0.6rem] text-canvas">
                  ✓
                </span>
              ) : null}
              <Silhueta tipo={t} className={`h-10 w-10 shrink-0 ${on ? "text-ink" : "text-ink-soft"}`} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight text-ink">{NOME_CURTO[t].nome}</span>
                <span className="block text-xs text-ink-soft">{NOME_CURTO[t].sub}</span>
                <span className="mt-0.5 block text-sm font-medium text-ink">{formatBRL(final)}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
        <span className="font-medium text-ink">{TIPOS_CADEIRA[e.tipo].rotulo}:</span> altura {m.altura}, largura {m.largura}, profundidade {m.profundidade}, aguenta {m.capacidade}
        {m.peso ? `, pesa ${m.peso}` : ""}.
        {e.tipo !== "normal" ? " A foto mostra a cadeira normal; na " + NOME_CURTO[e.tipo].nome.toLowerCase() + " o trançado e as cores são os mesmos." : ""}
      </p>
    </>
  );
}

/** Step: tassels (R$ 10 each), side when there's one, and the color among the chair's own threads. */
export function EscolhaTassel({ e, corA, corB }: { e: Escolha; corA: string; corB: string }) {
  const opcoes: { n: 0 | 1 | 2; t: string; s: string }[] = [
    { n: 0, t: "Sem tassel", s: "Incluso" },
    { n: 1, t: "1 tassel", s: `+${formatBRL(TASSEL_PRECO)}` },
    { n: 2, t: "2 tassels", s: `+${formatBRL(2 * TASSEL_PRECO)}` },
  ];
  const chip = (on: boolean) => `border px-3 py-1.5 text-sm transition-colors ${on ? "border-ink bg-ink text-canvas" : "border-line text-ink hover:border-ink"}`;
  return (
    <>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tassel">
        {opcoes.map((o) => {
          const on = e.tasselQtd === o.n;
          return (
            <button
              key={o.n}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => e.setTasselQtd(o.n)}
              className={`flex items-center gap-2 border px-2.5 py-2 text-left text-sm transition-colors ${on ? "border-ink bg-ink text-canvas" : "border-line text-ink hover:border-ink"}`}
            >
              {o.n ? <IconeTassel n={o.n} className="h-8 w-6 shrink-0 max-sm:hidden" /> : null}
              <span>
                <span className="block font-medium leading-tight">{o.t}</span>
                <span className={`block text-xs ${on ? "text-canvas/75" : "text-ink-soft"}`}>{o.s}</span>
              </span>
            </button>
          );
        })}
      </div>
      {e.tasselQtd ? (
        <div className="mt-3 grid gap-3">
          {e.tasselQtd === 1 ? (
            <div>
              <p className="text-xs text-ink-soft">De que lado (olhando de frente)</p>
              <div className="mt-1.5 flex gap-2">
                {(["esq", "dir"] as const).map((l) => (
                  <button key={l} type="button" aria-pressed={e.tasselLado === l} onClick={() => e.setTasselLado(l)} className={chip(e.tasselLado === l)}>
                    {l === "esq" ? "Esquerdo" : "Direito"}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <p className="text-xs text-ink-soft">Cor do tassel (uma das cores da cadeira)</p>
            <div className="mt-1.5 flex gap-2">
              {(
                [
                  ["a", corA, "Cor principal"],
                  ["b", corB, "Cor do detalhe"],
                ] as const
              ).map(([k, cor, rotulo]) => (
                <button key={k} type="button" aria-pressed={e.tasselCor === k} onClick={() => e.setTasselCor(k)} className={`inline-flex items-center gap-2 whitespace-nowrap ${chip(e.tasselCor === k)}`}>
                  <span aria-hidden className={`h-4 w-4 rounded-full border ${e.tasselCor === k ? "border-canvas/70" : "border-line"}`} style={{ background: cor }} />
                  {rotulo}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      <p className="mt-2 text-xs text-ink-soft md:hidden">Enfeite de corda trançada com conta de madeira, preso no alto do encosto.</p>
    </>
  );
}

function IconeTassel({ n, className = "" }: { n: 1 | 2; className?: string }) {
  const um = (x: number) => (
    <g key={x} transform={`translate(${x} 0)`} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M6 2c-2 0-2 4 0 4s2-4 0-4z" />
      <circle cx="6" cy="8" r="1.6" />
      <path d="M4.6 10h2.8M5 10.5l-1.2 9M6 10.5v9.5M7 10.5l1.2 9" />
    </g>
  );
  return (
    <svg viewBox={n === 2 ? "0 0 24 22" : "0 0 12 22"} className={className} aria-hidden>
      {n === 2 ? [um(0), um(12)] : um(0)}
    </svg>
  );
}

/** "Sua cadeira": every choice with its price, the total, Pix and card. */
export function ResumoCadeira({ e, children }: { e: Escolha; children?: ReactNode }) {
  const bf = useBlackFriday();
  const comNome = e.wantsNome || e.ehDesenho;
  const base = precoCadeira(e.ehDesenho, e.tipo);
  const linhas: [string, string][] = [[`${TIPOS_CADEIRA[e.tipo].rotulo}${e.ehDesenho ? " (desenho personalizado)" : ""}`, formatBRL(base)]];
  if (comNome && !e.ehDesenho) linhas.push([e.nomeTexto.trim() ? `Nome trançado: “${e.nomeTexto.trim()}”` : "Nome trançado", `+${formatBRL(precoCadeira(true, e.tipo) - base)}`]);
  if (e.madeira) linhas.push([e.madeiraInclusa ? "Braço de madeira (vem com ela)" : "Braço de madeira", `+${formatBRL(BRACO_MADEIRA[e.tipo])}`]);
  const nTassel = e.itemDoCarrinho.tassel ? (e.itemDoCarrinho.tasselQtd === 1 ? 1 : 2) : 0;
  if (nTassel) linhas.push([`${nTassel} tassel${nTassel > 1 ? "s" : ""}${e.tasselIncluso ? " (vem com ela)" : ""}`, `+${formatBRL(nTassel * TASSEL_PRECO)}`]);
  const final = precoBlackFriday(e.preco, bf);
  return (
    <div className="border border-ink bg-paper px-4 py-3 md:shadow-[0_14px_34px_-14px_rgba(36,31,26,0.45)]">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 lg:flex-nowrap">
        <div className="min-w-0">
          <p className="text-xs text-ink-soft">{bf ? `Total com Black Friday (−${bf.cupom.valor}%)` : "Total da sua cadeira"}</p>
          <p className="whitespace-nowrap text-2xl font-medium leading-tight text-ink">
            {final !== null ? <s className="mr-2 text-base text-ink-soft">{formatBRL(e.preco)}</s> : null}
            {formatBRL(final ?? e.preco)}
          </p>
          <p className="text-sm">
            <strong className="font-semibold text-ink">{formatBRL(precoPix(final ?? e.preco))} no Pix</strong>
            <span className="text-ink-soft"> ou até {PARCELAS_MAX}x</span>
          </p>
          {final === null ? <PrecoNatal preco={e.preco} className="mt-0.5" /> : null}
        </div>
        {children ? <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[19rem] lg:shrink-0">{children}</div> : null}
      </div>
      <details className="mt-2 border-t border-line pt-1.5 text-sm">
        <summary className="cursor-pointer text-ink-soft hover:text-ink">Ver o que entra no preço</summary>
        <dl className="mt-2 space-y-1">
          {linhas.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-ink-soft">{k}</dt>
              <dd className="shrink-0 text-ink">{v}</dd>
            </div>
          ))}
          {final !== null && bf ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Black Friday ({bf.cupom.valor}%)</dt>
              <dd className="shrink-0 text-ink">−{formatBRL(e.preco - final)}</dd>
            </div>
          ) : null}
        </dl>
      </details>
    </div>
  );
}
