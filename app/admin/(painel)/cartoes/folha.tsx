"use client";

import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { montarFolhas, normalizarCartao, type Cartao, type Colocado } from "@/lib/cartoes-modelo";
import { btnPrimary, btnSecondary, Card } from "../../_ui";
import { CartaoVisual } from "./cartao-visual";

// "Folha" tab (2026-11-10, user: "quero uma aba aonde eu posso colocar todos
// que eu quiser imprimir em um papel só"): pick several cards — different
// models and sizes — with how many of each, packed onto A4 sheets. Kept in
// this browser (localStorage) so it survives a reload while the atelier
// gathers what to print.

export type ItemFolha = { chave: string; c: Cartao; qtd: number };

const K = "sentarte-folha-cartoes";
const EVENTO = "folha-cartoes";

function ler() {
  try {
    return localStorage.getItem(K) ?? "[]";
  } catch {
    return "[]";
  }
}

function assinar(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENTO, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENTO, cb);
  };
}

/** The sheet's items, shared by the editor (“pôr na folha”) and this tab. */
export function useFolha(): [ItemFolha[], (itens: ItemFolha[]) => void] {
  const bruto = useSyncExternalStore(assinar, ler, () => "[]");
  const itens = useMemo(() => {
    try {
      return (JSON.parse(bruto) as ItemFolha[])
        .map((i) => ({ chave: String(i.chave), qtd: Math.max(1, Math.min(200, Math.floor(Number(i.qtd)) || 1)), c: normalizarCartao(i.c) }))
        .filter((i): i is ItemFolha => i.c !== null);
    } catch {
      return [];
    }
  }, [bruto]);
  const gravar = (novos: ItemFolha[]) => {
    try {
      localStorage.setItem(K, JSON.stringify(novos));
    } catch {}
    window.dispatchEvent(new Event(EVENTO));
  };
  return [itens, gravar];
}

export function cartoesDaFolha(itens: ItemFolha[]) {
  return montarFolhas(itens.flatMap((i) => Array.from({ length: i.qtd }, () => i.c)));
}

const MM = 96 / 25.4;
const cm = (mm: number) => String(mm / 10).replace(".", ",");

/** One A4 page with its cards in place (8 mm margins). */
export function PaginaA4({ cartoes, corte, escala }: { cartoes: Colocado[]; corte: boolean; escala?: number }) {
  const pagina = (
    <div className="pagina-livre" style={{ position: "relative", width: "194mm", height: "281mm" }}>
      {cartoes.map((k, i) => (
        <div key={i} style={{ position: "absolute", left: `${k.x}mm`, top: `${k.y}mm` }}>
          <CartaoVisual c={k.c} semFundo={!k.c.imprimirFundo} corte={corte} />
        </div>
      ))}
    </div>
  );
  if (!escala) return pagina;
  return (
    <div
      className="mx-auto overflow-hidden bg-white shadow-[0_8px_30px_-12px_rgba(36,28,20,0.45)] ring-1 ring-line"
      style={{ width: 210 * MM * escala, height: 297 * MM * escala }}
    >
      <div style={{ transform: `scale(${escala})`, transformOrigin: "top left", width: 210 * MM, height: 297 * MM, padding: "8mm" }}>{pagina}</div>
    </div>
  );
}

function Miniatura({ c }: { c: Cartao }) {
  const s = Math.min(56 / (c.largura * MM), 56 / (c.altura * MM));
  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center">
      <div style={{ width: c.largura * MM * s, height: c.altura * MM * s }}>
        <div style={{ transform: `scale(${s})`, transformOrigin: "top left", width: c.largura * MM, height: c.altura * MM }}>
          <CartaoVisual c={c} />
        </div>
      </div>
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
}: {
  modelos: Cartao[];
  atual: Cartao;
  itens: ItemFolha[];
  gravar: (i: ItemFolha[]) => void;
  linhaCorte: boolean;
  setLinhaCorte: (v: boolean) => void;
}) {
  const { paginas, grandes } = useMemo(() => cartoesDaFolha(itens), [itens]);
  const total = itens.reduce((n, i) => n + i.qtd, 0);

  const mudarQtd = (chave: string, qtd: number) =>
    gravar(qtd <= 0 ? itens.filter((i) => i.chave !== chave) : itens.map((i) => (i.chave === chave ? { ...i, qtd: Math.min(200, qtd) } : i)));
  const adicionar = (c: Cartao, chave: string) => {
    const ja = itens.find((i) => i.chave === chave);
    gravar(ja ? itens.map((i) => (i === ja ? { ...i, qtd: i.qtd + 1 } : i)) : [...itens, { chave, c, qtd: 1 }]);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
      <div className="space-y-6">
        <Card
          titulo={`Na folha (${total})`}
          descricao="Tudo o que está aqui sai junto, na mesma folha A4 (ou em mais de uma, se não couber). Mude a quantidade de cada um."
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
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight text-ink">{i.c.nome}</p>
                    <p className="text-xs text-ink-soft">
                      {cm(i.c.largura)} × {cm(i.c.altura)} cm
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
      </div>

      <div className="space-y-4 lg:sticky lg:top-6">
        <Card>
          <h2 className="font-serif text-xl font-medium tracking-tight text-ink">Como vai sair</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {total
              ? `${total} ${total === 1 ? "cartão" : "cartões"} em ${paginas.length} ${paginas.length === 1 ? "folha" : "folhas"} A4.`
              : "Ponha cartões na folha."}
          </p>
          {grandes.length ? (
            <p className="mt-2 text-sm text-clay-dark">Fora da folha (maior que 19 × 28 cm): {[...new Set(grandes.map((g) => g.nome))].join(", ")}.</p>
          ) : null}
          <div className="mt-4 space-y-4">
            {(paginas.length ? paginas : [[]]).map((p, n) => (
              <div key={n}>
                {paginas.length > 1 ? <p className="mb-1.5 text-center text-xs font-semibold text-ink-soft">Folha {n + 1}</p> : null}
                <PreviaA4 cartoes={p} corte={linhaCorte} />
              </div>
            ))}
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
            <input type="checkbox" checked={linhaCorte} onChange={(e) => setLinhaCorte(e.target.checked)} className="h-4 w-4 accent-wood" />
            Linha cinza de corte
          </label>
          <button type="button" disabled={!paginas.length} onClick={() => window.print()} className={`${btnPrimary} mt-4 w-full`}>
            Imprimir a folha ou salvar em PDF
          </button>
          <p className="mt-2 text-xs text-ink-soft">Na janela de impressão, deixe a escala em 100% (“Tamanho real”).</p>
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

/** The A4 preview, as wide as the column allows (max 42%). */
function PreviaA4({ cartoes, corte }: { cartoes: Colocado[]; corte: boolean }) {
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
    <div ref={ref} className="w-full">
      <PaginaA4 cartoes={cartoes} corte={corte} escala={escala} />
    </div>
  );
}
