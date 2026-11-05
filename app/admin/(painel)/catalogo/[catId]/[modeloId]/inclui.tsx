"use client";

import { useState } from "react";
import type { ModeloInclui } from "@/lib/content-schema";
import { BRACO_MADEIRA, formatBRL, PRECO_CADEIRA, PRECO_CADEIRA_COM_NOME, TASSEL_PRECO } from "@/lib/offer";

/**
 * "O que vem nesta cadeira" (user 2026-11-03: chairs uploaded with a name or
 * tassels must cost more): what the photographed chair comes with. Posted as
 * incluiNome / incluiTasseis / incluiTasselCor / incluiTasselLado /
 * incluiMadeira (+ the incluiCampos marker) to updateModeloAction.
 */
export function CampoInclui({ inicial }: { inicial?: ModeloInclui }) {
  const [nome, setNome] = useState(Boolean(inicial?.nome));
  const [tasseis, setTasseis] = useState<0 | 1 | 2>(inicial?.tasseis ?? 0);
  const [madeira, setMadeira] = useState(Boolean(inicial?.bracoMadeira));
  const extraNome = PRECO_CADEIRA_COM_NOME - PRECO_CADEIRA;

  return (
    <div className="space-y-3">
      <input type="hidden" name="incluiCampos" value="1" />

      <div data-rotulo="Nome trançado">
        <Opcao
          ativo={nome}
          titulo="Nome trançado"
          detalhe="Já vem com nome: o cliente é obrigado a escrever o nome para comprar. Se o nome for opcional, deixe desmarcado (o site já oferece “Personalizado” em toda cadeira)."
          preco={`+${formatBRL(extraNome)}`}
        >
          <input type="checkbox" name="incluiNome" checked={nome} onChange={(e) => setNome(e.target.checked)} className="peer sr-only" />
        </Opcao>
      </div>

      <fieldset data-rotulo="Tassel" className={`rounded-2xl border p-4 transition ${tasseis ? "border-wood/60 bg-rattan/[0.07]" : "border-line/80 bg-paper"}`}>
        <legend className="sr-only">Tassel</legend>
        <div className="flex items-start gap-3">
          <IconeTassel />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Tassel no encosto</p>
            <p className="text-xs text-ink-soft">{formatBRL(TASSEL_PRECO)} cada um.</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {([0, 1, 2] as const).map((n) => (
            <label
              key={n}
              data-opcao={n === 0 ? "Sem tassel" : `${n} tassel${n > 1 ? "s" : ""}`}
              className={`cursor-pointer rounded-xl border px-2 py-2.5 text-center text-sm transition ${
                tasseis === n ? "border-espresso bg-espresso text-paper shadow-sm" : "border-line bg-paper text-ink hover:border-wood"
              }`}
            >
              <input type="radio" name="incluiTasseis" value={n} checked={tasseis === n} onChange={() => setTasseis(n)} className="sr-only" />
              <span className="block font-semibold">{n === 0 ? "Sem" : n === 1 ? "1 tassel" : "2 tassels"}</span>
              <span className={`block text-xs ${tasseis === n ? "text-paper/70" : "text-ink-soft"}`}>{n ? `+${formatBRL(n * TASSEL_PRECO)}` : "R$ 0"}</span>
            </label>
          ))}
        </div>
        <div className={tasseis ? "mt-3 grid gap-3 sm:grid-cols-2" : "hidden"}>
          <label className="block" data-rotulo="Cor do tassel">
            <span className="text-xs font-semibold text-ink">Cor do tassel</span>
            <input
              name="incluiTasselCor"
              defaultValue={inicial?.tasselCor ?? ""}
              maxLength={30}
              placeholder="Ex.: vinho (vazio = igual à foto)"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-wood focus:ring-4 focus:ring-rattan/20"
            />
          </label>
          <div data-rotulo="Lado do tassel" className={tasseis === 1 ? "" : "hidden"}>
            <span className="text-xs font-semibold text-ink">Lado (olhando de frente)</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(["esq", "dir"] as const).map((l) => (
                <label key={l} data-opcao={l === "esq" ? "Esquerdo" : "Direito"} className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line bg-paper px-2 py-2 text-sm has-[:checked]:border-espresso has-[:checked]:bg-espresso has-[:checked]:text-paper">
                  <input type="radio" name="incluiTasselLado" value={l} defaultChecked={(inicial?.tasselLado ?? "dir") === l} className="sr-only" />
                  {l === "esq" ? "Esquerdo" : "Direito"}
                </label>
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      <div data-rotulo="Braço de madeira">
        <Opcao
          ativo={madeira}
          titulo="Braço de madeira"
          detalhe="No lugar do braço padrão."
          preco={`+${formatBRL(BRACO_MADEIRA.normal)}`}
        >
          <input type="checkbox" name="incluiMadeira" checked={madeira} onChange={(e) => setMadeira(e.target.checked)} className="peer sr-only" />
        </Opcao>
      </div>
    </div>
  );
}

function Opcao({ ativo, titulo, detalhe, preco, children }: { ativo: boolean; titulo: string; detalhe: string; preco: string; children: React.ReactNode }) {
  return (
    <label
      data-opcao={titulo}
      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
        ativo ? "border-wood/60 bg-rattan/[0.07]" : "border-line/80 bg-paper hover:border-wood/50"
      }`}
    >
      {children}
      <span
        aria-hidden
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${ativo ? "bg-verde" : "bg-line"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all ${ativo ? "left-[1.375rem]" : "left-0.5"}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{titulo}</span>
        <span className="block text-xs text-ink-soft">{detalhe}</span>
      </span>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${ativo ? "bg-verde/10 text-verde-escuro" : "bg-canvas-deep text-ink-soft"}`}>{preco}</span>
    </label>
  );
}

function IconeTassel() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-0.5 h-5 w-5 shrink-0 text-wood" aria-hidden>
      <path d="M12 2.5v3M10 5.5h4l-.5 3h-3zM9.5 8.5h5l1.5 10.5M9.5 8.5 8 19M12 8.5V20M10.5 8.5 9.8 20M13.5 8.5l.7 11.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
