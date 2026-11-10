"use client";

import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cartaoDoPassaporte, montarFolhas, normalizarCartao, versoDaPagina, type Cartao, type Colocado, type DadosPassaporte } from "@/lib/cartoes-modelo";
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
export type ModoImpressao = "tudo" | "frentes" | "versos";
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
      return { x: mm(a.x), y: mm(a.y), girar: a.girar === true };
    } catch {
      return { x: 0, y: 0, girar: false };
    }
  }, [bruto]);
  return [ajuste, (a) => gravarBruto(JSON.stringify(a))];
}

export function cartoesDaFolha(itens: ItemFolha[]) {
  return montarFolhas(itens.flatMap((i) => Array.from({ length: i.qtd }, () => i.c)));
}

const MM = 96 / 25.4;
const cm = (mm: number) => String(mm / 10).replace(".", ",");

function giro(k: Colocado) {
  if (!k.girado) return {};
  // rotate around the top-left corner, then slide back into the slot
  return k.sentido === -1
    ? { transform: `translateY(${k.c.largura}mm) rotate(-90deg)`, transformOrigin: "top left" }
    : { transform: `translateX(${k.c.altura}mm) rotate(90deg)`, transformOrigin: "top left" };
}

/** One A4 page with its cards in place (8 mm margins). */
export function PaginaA4({ cartoes, corte, escala }: { cartoes: Colocado[]; corte: boolean; escala?: number }) {
  const pagina = (
    <div className="pagina-livre" style={{ position: "relative", width: "194mm", height: "281mm" }}>
      {cartoes.map((k, i) => (
        <div key={i} style={{ position: "absolute", left: `${k.x}mm`, top: `${k.y}mm`, ...giro(k) }}>
          <CartaoVisual c={k.c} semFundo={!k.c.imprimirFundo} corte={corte} />
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

/**
 * What goes to the printer: fronts and (mirrored) backs, in the order the
 * chosen mode needs. Rendered into <body> by the editor; hidden on screen.
 */
export function ImpressaoFolhas({ frentes, corte, modo, ajuste }: { frentes: Colocado[][]; corte: boolean; modo: ModoImpressao; ajuste: AjusteVerso }) {
  const comVerso = temVerso(frentes);
  const verso = (p: Colocado[], n: number) => (
    <div key={`v${n}`} className="pagina-impressa">
      <div
        style={{
          transform: `translate(${ajuste.x}mm, ${ajuste.y}mm)${ajuste.girar ? " rotate(180deg)" : ""}`,
          transformOrigin: "97mm 140.5mm",
        }}
      >
        <PaginaA4 cartoes={versoDaPagina(p)} corte={corte} />
      </div>
    </div>
  );
  return (
    <>
      {frentes.flatMap((p, n) => [
        modo !== "versos" ? (
          <div key={`f${n}`} className="pagina-impressa">
            <PaginaA4 cartoes={p} corte={corte} />
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
  if (!comVerso)
    return (
      <>
        <button type="button" disabled={desativado} onClick={() => onImprimir("tudo")} className={`${btnPrimary} mt-4 w-full`}>
          Imprimir ou salvar em PDF
        </button>
        <p className="mt-2 text-xs text-ink-soft">Na janela de impressão, deixe a escala em 100% (“Tamanho real”) e as margens no padrão.</p>
      </>
    );
  const campo = "h-10 w-20 rounded-lg border border-line bg-paper px-2 text-center text-sm tabular-nums text-ink";
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl border border-line/70 bg-canvas p-3 text-sm text-ink">
        <p className="font-semibold">Frente e verso</p>
        <p className="mt-1 text-xs text-ink-soft">
          O verso sai espelhado: cada costas cai atrás da sua frente quando a folha vira como página de livro (na impressora: “frente e verso, virar pela borda
          longa”).
        </p>
      </div>
      <button type="button" disabled={desativado} onClick={() => onImprimir("tudo")} className={`${btnPrimary} w-full`}>
        Imprimir frente e verso
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={desativado} onClick={() => onImprimir("frentes")} className={btnSecondary}>
          1º Só as frentes
        </button>
        <button type="button" disabled={desativado} onClick={() => onImprimir("versos")} className={btnSecondary}>
          2º Só os versos
        </button>
      </div>
      <p className="text-xs text-ink-soft">
        Virando o papel à mão: imprima as frentes, ponha as folhas de volta na bandeja com o lado impresso virado (como a sua impressora pede) e imprima os
        versos. Faça uma folha de teste primeiro.
      </p>
      <details className="rounded-2xl border border-line/70 p-3 text-sm">
        <summary className="cursor-pointer font-semibold text-ink">Ajuste fino do verso</summary>
        <p className="mt-2 text-xs text-ink-soft">
          Se no teste o verso saiu um pouco deslocado, corrija aqui (fica guardado neste aparelho). Positivo: direita / para baixo, olhando o verso.
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
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-ink">
          <input
            type="checkbox"
            checked={ajuste.girar}
            onChange={(e) => setAjuste({ ...ajuste, girar: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-wood"
          />
          <span>
            <strong>Virar o verso de cabeça para baixo</strong> (se o verso saiu invertido no teste)
          </span>
        </label>
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
