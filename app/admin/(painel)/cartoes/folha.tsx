"use client";

import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  alturaDaPagina,
  cartaoDoPassaporte,
  montarDobradas,
  montarFolhas,
  normalizarCartao,
  versoDaPagina,
  type Cartao,
  type Colocado,
  type DadosPassaporte,
} from "@/lib/cartoes-modelo";
import { btnPrimary, btnSecondary, Card } from "../../_ui";
import { CartaoVisual } from "./cartao-visual";
import { ListaPassaportes, textoDoPassaporte } from "./escolher-passaporte";

// "Folha" tab (2026-11-10, user: "quero uma aba aonde eu posso colocar todos
// que eu quiser imprimir em um papel só"): pick several cards — different
// models and sizes — with how many of each, packed onto A4 sheets. Kept in
// this browser (localStorage) so it survives a reload while the atelier
// gathers what to print.
//
// Front and back ("vou querer coisa em frente e verso... calcula certinho para
// ficar no verso correto quando eu for recortar à mão"): every sheet that has
// a card with a back gets a mirrored back sheet (lib/cartoes-modelo.ts
// versoDaPagina), printed right after it, or separately ("só as frentes" then
// "só os versos") when the paper is turned by hand. A fine adjustment in mm
// and a 180° turn fix printers that feed the sheet off or upside down.

export type ItemFolha = { chave: string; c: Cartao; qtd: number };
export type ModoImpressao = "tudo" | "frentes" | "versos" | "teste" | "teste-frente" | "teste-verso" | "dobrar";
export type AjusteVerso = { x: number; y: number; girar: boolean };
export type Passaporte = DadosPassaporte & {
  rotulo: string;
  dia: string;
  modelo?: string;
  nomeTrancado?: string;
  tipo?: string;
  imagem?: string;
  cores?: string[];
  /** buyer's first name + city (admin only) */
  cliente?: string;
  pedido?: string;
};

const EVENTO = "folha-cartoes";

function assinar(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENTO, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENTO, cb);
  };
}

/** A value kept in this browser (localStorage), shared by every component that reads the same key. */
function useGuardado(chave: string, padrao: string): [string, (v: string) => void] {
  const ler = () => {
    try {
      return localStorage.getItem(chave) ?? padrao;
    } catch {
      return padrao;
    }
  };
  const bruto = useSyncExternalStore(assinar, ler, () => padrao);
  const gravar = (v: string) => {
    try {
      localStorage.setItem(chave, v);
    } catch {}
    window.dispatchEvent(new Event(EVENTO));
  };
  return [bruto, gravar];
}

/** The sheet's items, shared by the editor (“pôr na folha”) and this tab. */
export function useFolha(): [ItemFolha[], (itens: ItemFolha[]) => void] {
  const [bruto, gravarBruto] = useGuardado("sentarte-folha-cartoes", "[]");
  const itens = useMemo(() => {
    try {
      return (JSON.parse(bruto) as ItemFolha[])
        .map((i) => ({ chave: String(i.chave), qtd: Math.max(1, Math.min(200, Math.floor(Number(i.qtd)) || 1)), c: normalizarCartao(i.c) }))
        .filter((i): i is ItemFolha => i.c !== null);
    } catch {
      return [];
    }
  }, [bruto]);
  return [itens, (novos) => gravarBruto(JSON.stringify(novos))];
}

/** Printer fine-tuning for the back sheets (this browser only: it depends on the printer). */
export function useAjusteVerso(): [AjusteVerso, (a: AjusteVerso) => void] {
  const [bruto, gravarBruto] = useGuardado("sentarte-ajuste-verso", "{}");
  const ajuste = useMemo(() => {
    try {
      const a = JSON.parse(bruto) as Partial<AjusteVerso>;
      const mm = (v: unknown) => Math.max(-15, Math.min(15, Math.round((Number(v) || 0) * 2) / 2));
      // girar is no longer offered (user 2026-11-11: printer turns the sheet by itself, "não quero escolher");
      // an old "outra ponta" choice left in this browser would print every back upside down, so it's ignored
      return { x: mm(a.x), y: mm(a.y), girar: false };
    } catch {
      return { x: 0, y: 0, girar: false };
    }
  }, [bruto]);
  return [ajuste, (a) => gravarBruto(JSON.stringify(a))];
}

export function cartoesDaFolha(itens: ItemFolha[], dobrar = false) {
  const lista = itens.flatMap((i) => Array.from({ length: i.qtd }, () => i.c));
  return dobrar ? montarDobradas(lista) : montarFolhas(lista);
}

const MM = 96 / 25.4;
const cm = (mm: number) => String(mm / 10).replace(".", ",");

function giro(k: Colocado) {
  if (k.invertido) return { transform: "rotate(180deg)", transformOrigin: `${k.c.largura / 2}mm ${k.c.altura / 2}mm` };
  if (!k.girado) return {};
  // rotate around the top-left corner, then slide back into the slot
  return k.sentido === -1
    ? { transform: `translateY(${k.c.largura}mm) rotate(-90deg)`, transformOrigin: "top left" }
    : { transform: `translateX(${k.c.altura}mm) rotate(90deg)`, transformOrigin: "top left" };
}

/** One A4 page with its cards in place (8 mm margins). */
/**
 * `sangria` (mm): the card's printed background runs this far past its edge,
 * so a back that lands a little off doesn't leave a white strip when the
 * card is cut on the front's line (user 2026-11-11: "ajustar sozinho para
 * quando eu recortar com a tesoura ficar no lugar correto").
 */
export function PaginaA4({
  cartoes,
  corte,
  escala,
  altura = 281,
  sangria = 0,
}: {
  cartoes: Colocado[];
  corte: boolean;
  escala?: number;
  altura?: number;
  sangria?: number;
}) {
  const pagina = (
    <div className="pagina-livre" style={{ position: "relative", width: "194mm", height: `${altura}mm` }}>
      {cartoes.map((k, i) => (
        <div key={i} style={{ position: "absolute", left: `${k.x}mm`, top: `${k.y}mm`, ...giro(k) }}>
          {sangria && k.c.imprimirFundo ? (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: `${-sangria}mm`,
                top: `${-sangria}mm`,
                width: `${k.c.largura + 2 * sangria}mm`,
                height: `${k.c.altura + 2 * sangria}mm`,
                background: k.c.fundo,
                borderRadius: k.c.forma === "redondo" ? "50%" : 0,
              }}
            />
          ) : null}
          <div style={{ position: "relative" }}>
            <CartaoVisual c={k.c} semFundo={!k.c.imprimirFundo} corte={corte} />
          </div>
          {k.dobra ? (
            // fold line on the edge shared with the front: dashed, over a white strip hiding the cut line
            <div
              aria-hidden
              style={
                k.dobra === "topo"
                  ? {
                      position: "absolute",
                      top: "-0.3mm",
                      left: "-1.5mm",
                      width: `${k.c.largura + 3}mm`,
                      height: "0.6mm",
                      background: "repeating-linear-gradient(to right, #000 0 1.5mm, #fff 1.5mm 3mm)",
                    }
                  : {
                      position: "absolute",
                      left: "-0.3mm",
                      top: "-1.5mm",
                      height: `${k.c.altura + 3}mm`,
                      width: "0.6mm",
                      background: "repeating-linear-gradient(to bottom, #000 0 1.5mm, #fff 1.5mm 3mm)",
                    }
              }
            />
          ) : null}
        </div>
      ))}
    </div>
  );
  if (!escala) return pagina;
  return (
    <div
      className="mx-auto overflow-hidden bg-[#c9a47a] shadow-[0_8px_30px_-12px_rgba(36,28,20,0.45)] ring-1 ring-line"
      style={{ width: 210 * MM * escala, height: 297 * MM * escala }}
    >
      <div style={{ transform: `scale(${escala})`, transformOrigin: "top left", width: 210 * MM, height: 297 * MM, padding: "8mm" }}>{pagina}</div>
    </div>
  );
}

export const temVerso = (paginas: Colocado[][]) => paginas.some((p) => p.some((k) => k.c.verso));

// Alignment test sheet (user 2026-11-11: "a margem não ficou boa… lembra que
// a impressora depois puxa do outro lado a folha"). Front: a cross in the
// middle of the paper and "TOPO" arrows. Back: a mm ruler around the middle,
// moved by the current fine adjustment, and the arrows turned like the real
// backs. Held against the light, the number under the front's cross is the
// correction (added to the current value), and arrows pointing opposite ways
// mean the paper comes back the other way round (turn the back 180°).
const PAPEL = { w: 210, h: 289 }; // printed box: the 297 mm sheet minus a safety 8 mm at the bottom; centre at 105 × 148.5

function Seta({ y, texto }: { y: number; texto: string }) {
  return (
    <g>
      <path d={`M105 ${y} l-4 6 h8 z`} fill="#000" />
      <text x={105} y={y + 11} textAnchor="middle" fontSize={4} fontFamily="Arial, sans-serif" fontWeight={700}>
        {texto}
      </text>
    </g>
  );
}

function TesteFrente() {
  const cx = 105;
  const cy = 148.5;
  return (
    <div className="pagina-impressa" style={{ height: `${PAPEL.h}mm`, padding: 0 }}>
      <svg width={`${PAPEL.w}mm`} height={`${PAPEL.h}mm`} viewBox={`0 0 ${PAPEL.w} ${PAPEL.h}`} style={{ display: "block" }}>
        <Seta y={20} texto="TOPO (FRENTE)" />
        <line x1={cx - 40} y1={cy} x2={cx + 40} y2={cy} stroke="#000" strokeWidth={0.3} />
        <line x1={cx} y1={cy - 40} x2={cx} y2={cy + 40} stroke="#000" strokeWidth={0.3} />
        <text x={cx} y={cy + 55} textAnchor="middle" fontSize={4} fontFamily="Arial, sans-serif" fontWeight={700}>
          FOLHA DE TESTE: FRENTE
        </text>
        <text x={cx} y={cy + 62} textAnchor="middle" fontSize={3.2} fontFamily="Arial, sans-serif">
          Imprima o verso nas costas desta folha e olhe contra a luz.
        </text>
      </svg>
    </div>
  );
}

function TesteVerso({ ajuste }: { ajuste: AjusteVerso }) {
  const cx = 105;
  const cy = 148.5;
  const marcas = Array.from({ length: 31 }, (_, i) => i - 15);
  const fonte = { fontFamily: "Arial, sans-serif", fontSize: 2.6 };
  return (
    <div className="pagina-impressa" style={{ height: `${PAPEL.h}mm`, padding: 0, position: "relative" }}>
      {/* the ruler is symmetric around the centre, so only the fine adjustment moves it */}
      <svg
        width={`${PAPEL.w}mm`}
        height={`${PAPEL.h}mm`}
        viewBox={`0 0 ${PAPEL.w} ${PAPEL.h}`}
        style={{ display: "block", position: "absolute", inset: 0, transform: `translate(${ajuste.x}mm, ${ajuste.y}mm)` }}
      >
        {/* two separate rulers, where the front's lines cross them (25 mm from the middle) */}
        {marcas.map((t) => {
          const grande = t % 5 === 0;
          const l = t === 0 ? 7 : grande ? 5 : 3;
          const forte = t === 0 ? 0.4 : 0.2;
          const rot = t > 0 ? `+${t}` : String(t);
          return (
            <g key={t}>
              <line x1={cx + t} y1={cy + 25} x2={cx + t} y2={cy + 25 + l} stroke="#000" strokeWidth={forte} />
              <line x1={cx + 25} y1={cy + t} x2={cx + 25 + l} y2={cy + t} stroke="#000" strokeWidth={forte} />
              {grande ? (
                <>
                  <text x={cx + t} y={cy + 25 + 10} textAnchor="middle" {...fonte}>
                    {rot}
                  </text>
                  <text x={cx + 25 + 8.5} y={cy + t + 0.9} {...fonte}>
                    {rot}
                  </text>
                </>
              ) : null}
            </g>
          );
        })}
        <text x={cx} y={cy + 25 + 15} textAnchor="middle" {...fonte} fontWeight={700}>
          ↔ LINHA EM PÉ
        </text>
        <text x={cx + 25} y={cy - 19} textAnchor="middle" {...fonte} fontWeight={700}>
          LINHA DEITADA ↕
        </text>
        <text x={cx} y={cy + 55} textAnchor="middle" fontSize={4} fontFamily="Arial, sans-serif" fontWeight={700}>
          FOLHA DE TESTE: VERSO (réguas em mm)
        </text>
        <text x={cx} y={cy + 62} textAnchor="middle" fontSize={3.2} fontFamily="Arial, sans-serif">
          Contra a luz: em que número caiu cada linha da cruz da frente?
        </text>
      </svg>
      <svg
        width={`${PAPEL.w}mm`}
        height={`${PAPEL.h}mm`}
        viewBox={`0 0 ${PAPEL.w} ${PAPEL.h}`}
        style={{
          display: "block",
          position: "absolute",
          inset: 0,
          transform: `translate(${ajuste.x}mm, ${ajuste.y}mm)${ajuste.girar ? " rotate(180deg)" : ""}`,
          transformOrigin: "105mm 148.5mm",
        }}
      >
        <Seta y={20} texto="TOPO (VERSO)" />
      </svg>
    </div>
  );
}

/**
 * What goes to the printer: fronts and (mirrored) backs, in the order the
 * chosen mode needs. Rendered into <body> by the editor; hidden on screen.
 */
export function ImpressaoFolhas({ frentes, corte, modo, ajuste }: { frentes: Colocado[][]; corte: boolean; modo: ModoImpressao; ajuste: AjusteVerso }) {
  if (modo === "teste" || modo === "teste-frente" || modo === "teste-verso")
    return (
      <>
        {modo !== "teste-verso" ? <TesteFrente /> : null}
        {modo !== "teste-frente" ? <TesteVerso ajuste={ajuste} /> : null}
      </>
    );
  const comVerso = modo !== "dobrar" && temVerso(frentes);
  // The page has no printer margin (@page margin 0): each printed page is the
  // whole A4 width with our own 8 mm inside, so the cards' place on the paper
  // doesn't depend on the margins chosen in the print window.
  // A back keeps its front's height (same y on both sides); turned 180° it needs the whole sheet.
  const verso = (p: Colocado[], n: number) => {
    const h = ajuste.girar ? 281 : alturaDaPagina(p);
    return (
      <div key={`v${n}`} className="pagina-impressa" style={{ height: `${h + 8}mm` }}>
        <div
          style={{
            transform: `translate(${ajuste.x}mm, ${ajuste.y}mm)${ajuste.girar ? " rotate(180deg)" : ""}`,
            transformOrigin: "97mm 140.5mm",
          }}
        >
          <PaginaA4 cartoes={versoDaPagina(p)} corte={false} altura={h} sangria={1.5} />
        </div>
      </div>
    );
  };
  return (
    <>
      {frentes.flatMap((p, n) => [
        modo !== "versos" ? (
          <div key={`f${n}`} className="pagina-impressa" style={{ height: `${alturaDaPagina(p) + 8}mm` }}>
            <PaginaA4 cartoes={p} corte={corte} altura={alturaDaPagina(p)} sangria={comVerso ? 1.5 : 0} />
          </div>
        ) : null,
        comVerso && modo !== "frentes" ? verso(p, n) : null,
      ])}
    </>
  );
}

/** Buttons + printer fine-tuning, used by the editor and the Folha tab. */
export function BotoesImprimir({
  comVerso,
  onImprimir,
  desativado = false,
}: {
  comVerso: boolean;
  onImprimir: (m: ModoImpressao) => void;
  desativado?: boolean;
}) {
  const [ajuste, setAjuste] = useAjusteVerso();
  const [caiu, setCaiu] = useState({ x: "", y: "" });
  const num = (v: string) => Number(v.replace(",", ".").replace(/[^\d.+-]/g, "")) || 0;
  const limitar = (v: number) => Math.max(-15, Math.min(15, Math.round(v * 2) / 2));
  if (!comVerso)
    return (
      <>
        <button type="button" disabled={desativado} onClick={() => onImprimir("tudo")} className={`${btnPrimary} mt-4 w-full`}>
          Imprimir ou salvar em PDF
        </button>
        <p className="mt-2 text-xs text-ink-soft">Na janela de impressão, deixe a escala em 100% (“Padrão” ou “Tamanho real”) e as margens em “Padrão”.</p>
      </>
    );
  const campo = "h-10 w-20 rounded-lg border border-line bg-paper px-2 text-center text-sm tabular-nums text-ink";
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl border-2 border-wood bg-paper p-3 text-sm text-ink">
        <p className="font-semibold">Frente e verso</p>
        <p className="mt-1 text-xs text-ink-soft">
          O site já arruma tudo sozinho: os cartões ficam no meio da folha, cada verso cai atrás da sua frente, o verso não tem linha de corte (você corta pela
          linha da frente) e o fundo colorido passa um pouquinho da borda, para não ficar filete branco se o papel correr 1 mm.
        </p>
        <p className="mt-2 text-xs font-semibold text-ink">Na janela de impressão:</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-ink-soft">
          <li>
            Mais definições → <strong className="text-ink">Imprimir nos dois lados</strong> → <strong className="text-ink">Virar na borda longa</strong>
          </li>
          <li>
            Margens: <strong className="text-ink">Padrão</strong> · Escala: <strong className="text-ink">100%</strong> (nada de “Ajustar à página”)
          </li>
          <li>Ela mostra 2 páginas por folha (frente e verso): é assim mesmo.</li>
        </ul>
        <button type="button" disabled={desativado} onClick={() => onImprimir("tudo")} className={`${btnPrimary} mt-3 w-full`}>
          Imprimir frente e verso
        </button>
      </div>
      <div className="rounded-2xl border border-line/70 bg-canvas p-3 text-sm text-ink">
        <p className="font-semibold">Ou: imprimir para dobrar (nunca desalinha)</p>
        <p className="mt-1 text-xs text-ink-soft">
          Frente e verso lado a lado, num lado só do papel. Recorte em volta do par e dobre na linha tracejada. Gasta mais papel. Cartões redondos não dá para
          dobrar.
        </p>
        <button type="button" disabled={desativado} onClick={() => onImprimir("dobrar")} className={`${btnSecondary} mt-3 w-full`}>
          Imprimir para dobrar
        </button>
      </div>
      <details className="rounded-2xl border border-line/70 p-3 text-sm">
        <summary className="cursor-pointer font-semibold text-ink">Sua impressora não vira o papel sozinha?</summary>
        <p className="mt-2 text-xs text-ink-soft">
          Impressora que não vira o papel sozinha: “1º Só as frentes”, ponha as folhas de volta na bandeja e “2º Só os versos”.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" disabled={desativado} onClick={() => onImprimir("frentes")} className={btnSecondary}>
            1º Só as frentes
          </button>
          <button type="button" disabled={desativado} onClick={() => onImprimir("versos")} className={btnSecondary}>
            2º Só os versos
          </button>
        </div>
      </details>
      <div className="rounded-2xl border border-line/70 p-3 text-sm text-ink">
        <p className="font-semibold">Folha de teste (gasta 1 folha)</p>
        <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs text-ink-soft">
          <li>Imprima a folha de teste do mesmo jeito que vai imprimir os cartões.</li>
          <li>
            Olhe a folha <strong className="text-ink">contra a luz</strong>, pelo lado do verso. Se as setas “TOPO” apontam para lados opostos, na janela de
            impressão troque “borda longa” por “borda curta” (ou o contrário) e teste de novo.
          </li>
          <li>Veja em que número da régua do verso caiu a cruz da frente e escreva abaixo. Se caiu no zero, está perfeito.</li>
        </ol>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button type="button" onClick={() => onImprimir("teste")} className={`${btnSecondary} col-span-3`}>
            Imprimir folha de teste (frente e verso)
          </button>
          <button type="button" onClick={() => onImprimir("teste-frente")} className={btnSecondary}>
            Teste 1º frente
          </button>
          <button type="button" onClick={() => onImprimir("teste-verso")} className={btnSecondary}>
            Teste 2º verso
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-ink">
            Linha em pé caiu no
            <input
              inputMode="decimal"
              placeholder="0"
              value={caiu.x}
              onChange={(e) => setCaiu({ ...caiu, x: e.target.value })}
              className={`${campo} mt-1 block`}
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Linha deitada caiu no
            <input
              inputMode="decimal"
              placeholder="0"
              value={caiu.y}
              onChange={(e) => setCaiu({ ...caiu, y: e.target.value })}
              className={`${campo} mt-1 block`}
            />
          </label>
          <button
            type="button"
            disabled={!num(caiu.x) && !num(caiu.y)}
            onClick={() => {
              setAjuste({ ...ajuste, x: limitar(ajuste.x + num(caiu.x)), y: limitar(ajuste.y + num(caiu.y)) });
              setCaiu({ x: "", y: "" });
            }}
            className={btnPrimary}
          >
            Corrigir
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Depois de corrigir, imprima o teste de novo: a cruz deve cair no zero. A correção fica guardada neste aparelho.
        </p>
      </div>
      <details className="rounded-2xl border border-line/70 p-3 text-sm">
        <summary className="cursor-pointer font-semibold text-ink">Ajuste fino do verso (valores guardados)</summary>
        <p className="mt-2 text-xs text-ink-soft">
          O que já está corrigido, em mm. Positivo: direita / para baixo, olhando o verso. Zere os dois para voltar ao normal.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-ink">
            Lados (mm)
            <input
              type="number"
              step={0.5}
              value={ajuste.x}
              onChange={(e) => setAjuste({ ...ajuste, x: Number(e.target.value) || 0 })}
              className={`${campo} mt-1 block`}
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Cima / baixo (mm)
            <input
              type="number"
              step={0.5}
              value={ajuste.y}
              onChange={(e) => setAjuste({ ...ajuste, y: Number(e.target.value) || 0 })}
              className={`${campo} mt-1 block`}
            />
          </label>
        </div>
      </details>
    </div>
  );
}

function Miniatura({ c }: { c: Cartao }) {
  const s = Math.min(56 / (c.largura * MM), 56 / (c.altura * MM));
  return (
    <div className="relative grid h-14 w-14 shrink-0 place-items-center">
      <div style={{ width: c.largura * MM * s, height: c.altura * MM * s }}>
        <div style={{ transform: `scale(${s})`, transformOrigin: "top left", width: c.largura * MM, height: c.altura * MM }}>
          <CartaoVisual c={c} />
        </div>
      </div>
      {c.verso ? (
        <span className="absolute -bottom-1 -right-1 rounded-full bg-espresso px-1.5 py-0.5 text-[0.6rem] font-semibold text-paper" title="Frente e verso">
          F+V
        </span>
      ) : null}
    </div>
  );
}

function Contador({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  const b = "grid h-9 w-9 place-items-center rounded-full border border-line bg-paper text-lg font-semibold text-ink hover:border-wood";
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className={b} onClick={() => onChange(valor - 1)} aria-label="Menos um">
        −
      </button>
      <input
        inputMode="numeric"
        value={valor}
        onChange={(e) => onChange(Math.floor(Number(e.target.value.replace(/\D/g, ""))) || 0)}
        className="h-9 w-12 rounded-lg border border-line bg-paper text-center text-sm font-semibold tabular-nums text-ink"
        aria-label="Quantos"
      />
      <button type="button" className={b} onClick={() => onChange(valor + 1)} aria-label="Mais um">
        +
      </button>
    </div>
  );
}

export function AbaFolha({
  modelos,
  atual,
  itens,
  gravar,
  linhaCorte,
  setLinhaCorte,
  passaportes,
  estiloPassaporte,
  onImprimir,
}: {
  modelos: Cartao[];
  atual: Cartao;
  itens: ItemFolha[];
  gravar: (i: ItemFolha[]) => void;
  linhaCorte: boolean;
  setLinhaCorte: (v: boolean) => void;
  passaportes: Passaporte[];
  estiloPassaporte: Cartao;
  onImprimir: (m: ModoImpressao) => void;
}) {
  const { paginas, grandes } = useMemo(() => cartoesDaFolha(itens), [itens]);
  const total = itens.reduce((n, i) => n + i.qtd, 0);
  const comVerso = temVerso(paginas);
  const [ajuste] = useAjusteVerso();

  const mudarQtd = (chave: string, qtd: number) =>
    gravar(qtd <= 0 ? itens.filter((i) => i.chave !== chave) : itens.map((i) => (i.chave === chave ? { ...i, qtd: Math.min(200, qtd) } : i)));
  const adicionar = (c: Cartao, chave: string) => {
    const ja = itens.find((i) => i.chave === chave);
    gravar(ja ? itens.map((i) => (i === ja ? { ...i, qtd: i.qtd + 1 } : i)) : [...itens, { chave, c, qtd: 1 }]);
  };
  const chavePassaporte = (p: Passaporte) => `passaporte-${p.n}`;
  const porPassaportes = (lista: Passaporte[]) => {
    const novos = lista.filter((p) => !itens.some((i) => i.chave === chavePassaporte(p)));
    gravar([...itens, ...novos.map((p) => ({ chave: chavePassaporte(p), c: cartaoDoPassaporte(estiloPassaporte, p), qtd: 1 }))]);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
      <div className="space-y-6">
        <Card
          titulo={`Na folha (${total})`}
          descricao="Tudo o que está aqui sai junto, na mesma folha A4 (ou em mais de uma, se não couber). Mude a quantidade de cada um. F+V = tem verso."
          acao={
            itens.length ? (
              <button type="button" className={btnSecondary} onClick={() => gravar([])}>
                Esvaziar a folha
              </button>
            ) : null
          }
        >
          {itens.length ? (
            <ul className="divide-y divide-line/70">
              {itens.map((i) => (
                <li key={i.chave} className="flex flex-wrap items-center gap-3 py-3">
                  <Miniatura c={i.c} />
                  <div className="min-w-[11rem] flex-1">
                    <p className="font-semibold leading-tight text-ink">{i.c.nome}</p>
                    {(() => {
                      const p = passaportes.find((x) => chavePassaporte(x) === i.chave);
                      return p ? (
                        <p className="text-sm text-ink">
                          Vai na cadeira: {textoDoPassaporte(p)}
                          {p.cliente ? <span className="text-ink-soft"> · cliente {p.cliente}</span> : null}
                        </p>
                      ) : null;
                    })()}
                    <p className="text-xs text-ink-soft">
                      {cm(i.c.largura)} × {cm(i.c.altura)} cm{i.c.verso ? " · frente e verso" : ""}
                    </p>
                  </div>
                  <Contador valor={i.qtd} onChange={(v) => mudarQtd(i.chave, v)} />
                  <button type="button" onClick={() => mudarQtd(i.chave, 0)} className="text-sm text-ink-soft hover:text-clay">
                    Tirar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">A folha está vazia. Toque em “Pôr na folha” nos cartões abaixo.</p>
          )}
        </Card>

        <Card
          titulo="Escolha o que pôr na folha"
          descricao="Cada toque põe mais um. O primeiro da lista é o cartão que está aberto no editor agora, do jeito que você deixou."
        >
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
            {[
              { c: atual, chave: `editor-${hash(atual)}`, rotulo: "Aberto no editor" },
              ...modelos.map((c) => ({ c, chave: `modelo-${c.id}-${hash(c)}`, rotulo: "" })),
            ].map(({ c, chave, rotulo }) => (
              <li key={chave} className="flex items-center gap-3 rounded-2xl border border-line/70 bg-canvas p-3">
                <Miniatura c={c} />
                <div className="min-w-0 flex-1">
                  {rotulo ? <p className="text-xs font-semibold uppercase tracking-wide text-clay">{rotulo}</p> : null}
                  <p className="truncate text-sm font-semibold text-ink">{c.nome}</p>
                  <p className="text-xs text-ink-soft">
                    {cm(c.largura)} × {cm(c.altura)} cm
                  </p>
                </div>
                <button type="button" onClick={() => adicionar(c, chave)} className={btnSecondary}>
                  Pôr na folha
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          titulo="Etiquetas do passaporte"
          descricao="As cadeiras com passaporte, cada uma com o seu número e QR code. O visual é o do modelo “Etiqueta do passaporte” (mude no editor e salve em Meus modelos para usar o seu)."
          acao={
            passaportes.length ? (
              <button type="button" className={btnSecondary} onClick={() => porPassaportes(passaportes.slice(0, 9))}>
                Pôr as {Math.min(9, passaportes.length)} mais novas
              </button>
            ) : null
          }
        >
          {passaportes.length ? (
            <ListaPassaportes
              passaportes={passaportes}
              acao={(p) => {
                const na = itens.some((i) => i.chave === chavePassaporte(p));
                return (
                  <button type="button" disabled={na} onClick={() => porPassaportes([p])} className={btnSecondary + " w-full sm:w-auto"}>
                    {na ? "Já está na folha" : "Pôr na folha"}
                  </button>
                );
              }}
            />
          ) : (
            <p className="text-sm text-ink-soft">Ainda nenhum passaporte. Toda cadeira paga ganha o seu (veja em Passaportes).</p>
          )}
        </Card>
      </div>

      <div className="space-y-4 lg:sticky lg:top-6">
        <Card>
          <h2 className="font-serif text-xl font-medium tracking-tight text-ink">Como vai sair</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {total
              ? `${total} ${total === 1 ? "cartão" : "cartões"} em ${paginas.length} ${paginas.length === 1 ? "folha" : "folhas"} A4${comVerso ? ", com verso" : ""}.`
              : "Ponha cartões na folha."}
          </p>
          {grandes.length ? (
            <p className="mt-2 text-sm text-clay-dark">Fora da folha (maior que 19 × 28 cm): {[...new Set(grandes.map((g) => g.nome))].join(", ")}.</p>
          ) : null}
          <div className="mt-4 space-y-4">
            {(paginas.length ? paginas : [[]]).map((p, n) => (
              <div key={n} className={comVerso ? "grid grid-cols-2 gap-2" : ""}>
                <div>
                  {paginas.length > 1 || comVerso ? (
                    <p className="mb-1.5 text-center text-xs font-semibold text-ink-soft">
                      Folha {n + 1}
                      {comVerso ? " · frente" : ""}
                    </p>
                  ) : null}
                  <PreviaA4 cartoes={p} corte={linhaCorte} />
                </div>
                {comVerso ? (
                  <div>
                    <p className="mb-1.5 text-center text-xs font-semibold text-ink-soft">Folha {n + 1} · verso</p>
                    <PreviaA4 cartoes={versoDaPagina(p)} corte={linhaCorte} girar={ajuste.girar} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
            <input type="checkbox" checked={linhaCorte} onChange={(e) => setLinhaCorte(e.target.checked)} className="h-4 w-4 accent-wood" />
            Linha cinza de corte
          </label>
          <BotoesImprimir comVerso={comVerso} onImprimir={onImprimir} desativado={!paginas.length} />
        </Card>
      </div>
    </div>
  );
}

/** Short fingerprint: the same model edited differently is a different item. */
function hash(c: Cartao) {
  const s = JSON.stringify({ ...c, nome: "" });
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** The A4 preview (kraft-coloured: that is the paper used), as wide as the column allows (max 42%). */
function PreviaA4({ cartoes, corte, girar = false }: { cartoes: Colocado[]; corte: boolean; girar?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(0.42);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setEscala(Math.min(0.42, el.clientWidth / (210 * MM)));
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    medir();
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="w-full" style={girar ? { transform: "rotate(180deg)" } : undefined}>
      <PaginaA4 cartoes={cartoes} corte={corte} escala={escala} />
    </div>
  );
}
