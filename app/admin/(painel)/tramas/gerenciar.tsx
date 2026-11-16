"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { celulaDaForma, desenharMiniatura, type Forma } from "@/lib/chair-render";
import { CATEGORIAS, type Categoria } from "@/lib/formas-categorias";
import { semAcento } from "@/lib/formas-lista";
import { FIOS, type Fio } from "@/lib/palette";
import { brilhoDasCelulas, codificarDesenho, decodificarDesenho, FOTO_COLS, FOTO_ROWS, gradeDaFoto, limiarAutomatico, type Desenho } from "@/lib/trama-foto";
import { gradeDaPixelArte, lerPixelArte, type PixelArte } from "@/lib/trama-pixel";
import { MAX_TRAMAS_NOVAS, PREFIXO_NOVA, TODAS_AS_FORMAS, type TramaNova, type TramasDoPainel } from "@/lib/tramas-painel";
import { salvarTramasAction } from "../../actions";
import { AdminForm, SaveButton } from "../../_ui";
import { btnSecondary, inputClass } from "../../_classes";

// /admin/tramas (2026-11-16): the admin sees every shape of Monte a sua trama,
// takes out the ones she doesn't like, brings back hidden ones and draws new
// ones on the backrest's 29x29 woven grid. Everything is kept here until
// "Publicar no site" (one commit, see salvarTramasAction).

const N = FOTO_COLS * FOTO_ROWS;
const vazio = (): Desenho => ({ bits: new Uint8Array(N), cols: FOTO_COLS, rows: FOTO_ROWS });
type Filtro = "site" | "fora" | "meus" | "mudou";
type Item = { valor: string; rotulo: string; grupo: Categoria; doCodigoOculta: boolean; grade?: string };

const COR_A = "#1C1C1E";
const COR_B = "#F3F1EC";

function naSite(t: TramasDoPainel, f: Item) {
  if (f.grade) return true;
  return !t.ocultas.includes(f.valor) && (!f.doCodigoOculta || t.mostrar.includes(f.valor));
}

function novoId() {
  const letras = "abcdefghijklmnopqrstuvwxyz";
  return Array.from({ length: 8 }, () => letras[Math.floor(Math.random() * letras.length)]).join("");
}

/** The cells of any shape (a code shape = 29x29, or a drawn one of any size). */
function bitsDe(f: Item): Desenho {
  if (f.grade) return decodificarDesenho(f.grade) ?? vazio();
  const b = new Uint8Array(N);
  for (let j = 0; j < FOTO_ROWS; j++)
    for (let i = 0; i < FOTO_COLS; i++)
      b[j * FOTO_COLS + i] = (f.valor === "meio-a-meio" ? i >= FOTO_COLS / 2 : f.valor !== "lisa" && celulaDaForma(f.valor as Forma, i, j, FOTO_COLS, FOTO_ROWS)) ? 1 : 0;
  return { bits: b, cols: FOTO_COLS, rows: FOTO_ROWS };
}

function Miniatura({ item, corA = COR_A, corB = COR_B }: { item: Item; corA?: string; corB?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const grade = item.grade ? decodificarDesenho(item.grade) : null;
    desenharMiniatura(ctx, c.width, c.height, (grade ? "foto" : item.valor) as Forma, corA, corB, "encosto", grade);
  }, [item, corA, corB]);
  return <canvas ref={ref} width={165} height={135} className="aspect-[165/135] w-full rounded-lg bg-canvas" />;
}

export function GerenciarTramas({ inicial }: { inicial: TramasDoPainel }) {
  const [base, setBase] = useState(inicial);
  const [t, setT] = useState(inicial);
  const [filtro, setFiltro] = useState<Filtro>("site");
  const [grupo, setGrupo] = useState<Categoria>("basicos");
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<{ id?: string; rotulo: string; grupo: Categoria; bits: Desenho; arquivo?: File; vez?: number } | null>(null);
  const anexoRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const itens: Item[] = useMemo(
    () => [
      ...TODAS_AS_FORMAS,
      ...t.novas.map((n) => ({ valor: PREFIXO_NOVA + n.id, rotulo: n.rotulo, grupo: n.grupo, doCodigoOculta: false, grade: n.grade })),
    ],
    [t.novas]
  );
  const itensBase: Item[] = useMemo(
    () => [...TODAS_AS_FORMAS, ...base.novas.map((n) => ({ valor: PREFIXO_NOVA + n.id, rotulo: n.rotulo, grupo: n.grupo, doCodigoOculta: false, grade: n.grade }))],
    [base.novas]
  );

  // what changed since the last publish
  const mudancas = useMemo(() => {
    const antes = new Map(itensBase.map((f) => [f.valor, naSite(base, f)]));
    const tirados: string[] = [];
    const voltam: string[] = [];
    for (const f of TODAS_AS_FORMAS) {
      const a = antes.get(f.valor);
      const d = naSite(t, f);
      if (a && !d) tirados.push(f.rotulo);
      if (!a && d) voltam.push(f.rotulo);
    }
    const idsAntes = new Map(base.novas.map((n) => [n.id, n]));
    const idsAgora = new Set(t.novas.map((n) => n.id));
    const novos = t.novas.filter((n) => !idsAntes.has(n.id)).map((n) => n.rotulo);
    const editados = t.novas.filter((n) => {
      const a = idsAntes.get(n.id);
      return a && (a.rotulo !== n.rotulo || a.grupo !== n.grupo || a.grade !== n.grade);
    }).map((n) => n.rotulo);
    const apagados = base.novas.filter((n) => !idsAgora.has(n.id)).map((n) => n.rotulo);
    return { tirados, voltam, novos, editados, apagados, total: tirados.length + voltam.length + novos.length + editados.length + apagados.length };
  }, [t, base, itensBase]);
  const mudouValor = useMemo(() => {
    const antes = new Map(itensBase.map((f) => [f.valor, naSite(base, f)]));
    const s = new Set<string>();
    for (const f of itens) if (antes.get(f.valor) !== naSite(t, f) || (f.grade && base.novas.find((n) => PREFIXO_NOVA + n.id === f.valor)?.grade !== f.grade)) s.add(f.valor);
    return s;
  }, [itens, itensBase, t, base]);

  const termo = semAcento(busca);
  const passaFiltro = (f: Item) =>
    filtro === "site" ? naSite(t, f) : filtro === "fora" ? !naSite(t, f) : filtro === "meus" ? Boolean(f.grade) : mudouValor.has(f.valor);
  const visiveis = itens.filter((f) => passaFiltro(f) && (termo ? semAcento(f.rotulo).includes(termo) : f.grupo === grupo));
  const conta = (x: Filtro) => itens.filter((f) => (x === "site" ? naSite(t, f) : x === "fora" ? !naSite(t, f) : x === "meus" ? Boolean(f.grade) : mudouValor.has(f.valor))).length;
  const contaAba = (g: Categoria) => itens.filter((f) => f.grupo === g && passaFiltro(f)).length;

  const alternar = (f: Item) =>
    setT((v) => {
      const ocultas = new Set(v.ocultas);
      const mostrar = new Set(v.mostrar);
      if (naSite(v, f)) {
        if (f.doCodigoOculta) mostrar.delete(f.valor);
        else ocultas.add(f.valor);
      } else {
        ocultas.delete(f.valor);
        if (f.doCodigoOculta) mostrar.add(f.valor);
      }
      return { ...v, ocultas: [...ocultas], mostrar: [...mostrar] };
    });

  const abrirEditor = (e: NonNullable<typeof editando>) => {
    setEditando(e);
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const guardar = (e: NonNullable<typeof editando>) => {
    const grade = codificarDesenho(e.bits);
    const n: TramaNova = { id: e.id ?? novoId(), rotulo: e.rotulo.trim(), grupo: e.grupo, grade };
    setT((v) => ({ ...v, novas: e.id ? v.novas.map((x) => (x.id === e.id ? n : x)) : [...v.novas, n] }));
    setEditando(null);
    setFiltro("meus");
    setGrupo(e.grupo);
    setBusca("");
  };

  const json = JSON.stringify(t);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2" aria-label="Mostrar">
          {(
            [
              ["site", "No site"],
              ["fora", "Fora do site"],
              ["meus", "Feitos por você"],
              ["mudou", "Mudados agora"],
            ] as [Filtro, string][]
          ).map(([id, rotulo]) => {
            const on = filtro === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => setFiltro(id)}
                className={`inline-flex flex-col items-center justify-center rounded-2xl border px-1 py-1.5 text-center text-xs font-medium leading-tight transition sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-3.5 sm:py-2 sm:text-sm ${on ? "border-espresso bg-espresso text-paper" : "border-line bg-paper text-ink hover:border-wood"}`}
              >
                {rotulo}
                <span className={`font-semibold sm:font-normal ${on ? "text-rattan" : "text-ink-soft"}`}>{conta(id)}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={t.novas.length >= MAX_TRAMAS_NOVAS}
          onClick={() => abrirEditor({ rotulo: "", grupo: termo ? "divertidos" : grupo, bits: vazio() })}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-espresso px-4 py-2.5 text-sm font-semibold text-paper hover:bg-espresso-soft disabled:opacity-50"
        >
          <span className="text-rattan">+</span> Desenhar um traçado novo
        </button>
      </div>
      {/* Pixel art / cross-stitch chart straight to the chair (user 2026-11-16) */}
      <input
        ref={anexoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const arq = e.target.files?.[0];
          e.target.value = "";
          if (arq) abrirEditor({ rotulo: "", grupo: termo ? "divertidos" : grupo, bits: vazio(), arquivo: arq, vez: Date.now() });
        }}
      />
      {editando ? null : (
        <button
          type="button"
          disabled={t.novas.length >= MAX_TRAMAS_NOVAS}
          onClick={() => anexoRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-3xl border-2 border-dashed border-wood/50 bg-paper px-4 py-3.5 text-left hover:border-wood hover:bg-canvas disabled:opacity-50"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-wood to-espresso text-xl text-paper" aria-hidden>
            📎
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">Anexar uma imagem e pôr na cadeira</span>
            <span className="block text-xs text-ink-soft">Desenho em pixel ou gráfico de ponto cruz (JPG ou PNG). Cada quadradinho vira um ponto da trama.</span>
          </span>
        </button>
      )}

      {editando ? (
        <div ref={editorRef} className="scroll-mt-24">
          <EditorTrama
            key={`${editando.id ?? "novo"}-${editando.vez ?? 0}`}
            inicial={editando}
            itens={itens}
            existentes={t.novas}
            onCancelar={() => setEditando(null)}
            onGuardar={guardar}
          />
        </div>
      ) : null}

      <div className="rounded-3xl border border-line/70 bg-paper p-4 sm:p-6">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar traçado (ex.: escudo, estrela, tartaruga)"
          className={inputClass}
        />
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-espresso p-1 sm:grid-cols-6 lg:grid-cols-11" role="tablist" aria-label="Abas do Monte a sua trama">
          {CATEGORIAS.map((c) => {
            const on = grupo === c.valor && !termo;
            return (
              <button
                key={c.valor}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setGrupo(c.valor);
                  setBusca("");
                }}
                className={`flex flex-col items-center rounded-xl px-1 py-1.5 text-xs leading-tight transition ${on ? "bg-paper font-semibold text-ink" : "text-paper/80 hover:bg-paper/10"}`}
              >
                {c.curto}
                <span className={on ? "text-wood" : "text-rattan"}>{contaAba(c.valor)}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-ink-soft" aria-live="polite">
          {termo ? `${visiveis.length} encontrados em todas as abas.` : `${visiveis.length} nesta aba.`}{" "}
          {filtro === "fora"
            ? "Estes não aparecem para o cliente. Toque em “Pôr no site” nos que você quer de volta."
            : filtro === "site"
              ? "Estes aparecem para o cliente. Toque em “Tirar do site” nos que você não gostou."
              : null}
        </p>

        {visiveis.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-ink-soft">
            {filtro === "meus" ? "Você ainda não desenhou nenhum traçado nesta aba." : "Nenhum traçado aqui."}
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {visiveis.map((f) => {
              const on = naSite(t, f);
              const mudou = mudouValor.has(f.valor);
              return (
                <li
                  key={f.valor}
                  className={`flex flex-col gap-1.5 rounded-2xl border p-2 transition ${on ? "border-line/70 bg-paper" : "border-dashed border-line bg-canvas"} ${mudou ? "ring-2 ring-rattan/60" : ""}`}
                >
                  <div className={on ? "" : "opacity-45 grayscale"}>
                    <Miniatura item={f} />
                  </div>
                  <p className="min-h-[2.5em] text-xs leading-tight text-ink">
                    {f.rotulo}
                    {f.grade ? <span className="ml-1 rounded-full bg-rattan/25 px-1.5 text-[0.7rem] font-semibold text-wood-dark">seu</span> : null}
                    {!on ? <span className="block text-ink-soft">fora do site</span> : null}
                  </p>
                  {f.grade ? (
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const n = t.novas.find((x) => PREFIXO_NOVA + x.id === f.valor);
                          if (n) abrirEditor({ id: n.id, rotulo: n.rotulo, grupo: n.grupo, bits: bitsDe(f) });
                        }}
                        className="rounded-full border border-line px-2 py-1.5 text-xs font-medium text-ink hover:border-wood"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setT((v) => ({ ...v, novas: v.novas.filter((x) => PREFIXO_NOVA + x.id !== f.valor) }))}
                        className="rounded-full border border-clay/40 px-2 py-1.5 text-xs font-medium text-clay hover:bg-clay/10"
                      >
                        Apagar
                      </button>
                    </div>
                  ) : f.valor === "lisa" ? (
                    <p className="py-1.5 text-center text-xs text-ink-soft">Sempre no site: é por onde o cliente começa.</p>
                  ) : (
                    <div className="grid gap-1">
                      <button
                        type="button"
                        onClick={() => alternar(f)}
                        className={`rounded-full px-2 py-1.5 text-xs font-semibold transition ${on ? "border border-line text-ink hover:border-clay hover:text-clay" : "bg-verde text-paper hover:bg-verde-escuro"}`}
                      >
                        {on ? "Tirar do site" : "Pôr no site"}
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirEditor({ rotulo: `${f.rotulo} (meu)`.slice(0, 40), grupo: f.grupo, bits: bitsDe(f) })}
                        className="text-xs text-ink-soft underline-offset-2 hover:text-ink hover:underline"
                      >
                        Copiar e mudar
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* publish bar: only the hidden JSON and the button live inside the form, so
          its remount after saving doesn't reset what's on the screen */}
      <AdminForm action={salvarTramasAction} aoSalvar={() => setBase(t)}>
        <input type="hidden" name="tramas" value={json} />
        <div
          className={`sticky bottom-[calc(5.3rem+env(safe-area-inset-bottom))] z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-[0_12px_32px_-16px_rgba(36,28,20,0.5)] lg:bottom-4 ${mudancas.total ? "border-espresso bg-espresso text-paper" : "border-line bg-paper text-ink-soft"}`}
        >
          <div className="min-w-0 text-sm">
            {mudancas.total ? (
              <>
                <p className="font-semibold">
                  {mudancas.total === 1 ? "1 mudança ainda não publicada" : `${mudancas.total} mudanças ainda não publicadas`}
                </p>
                <p className="text-xs text-paper/75">
                  {[
                    mudancas.tirados.length && `${mudancas.tirados.length} saem do site`,
                    mudancas.voltam.length && `${mudancas.voltam.length} voltam`,
                    mudancas.novos.length && `${mudancas.novos.length} novos`,
                    mudancas.editados.length && `${mudancas.editados.length} editados`,
                    mudancas.apagados.length && `${mudancas.apagados.length} apagados`,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </>
            ) : (
              <p>Tudo igual ao site.</p>
            )}
          </div>
          <div className="flex gap-2">
            {mudancas.total ? (
              <button type="button" onClick={() => setT(base)} className="rounded-full border border-paper/30 px-4 py-2 text-sm font-medium text-paper hover:bg-paper/10">
                Desfazer tudo
              </button>
            ) : null}
            {mudancas.total ? (
              <SaveButton className="inline-flex items-center gap-2 rounded-full bg-verde px-5 py-2 text-sm font-semibold text-paper hover:bg-verde-escuro disabled:opacity-60">
                Publicar no site
              </SaveButton>
            ) : null}
          </div>
        </div>
      </AdminForm>
    </div>
  );
}

// --- Drawing a shape -------------------------------------------------------------------

const LADO = 12; // px per cell on the drawing canvas

/** A picture turned into points: read as pixel art / cross-stitch chart, or as a photo by brightness. */
type Imagem = {
  url: string;
  arte: PixelArte | null;
  brilho: Float32Array;
  modo: "pixel" | "foto";
  limiar: number;
  tolerancia: number;
  inverter: boolean;
  info: { largura: number; altura: number } | null;
};
const TOLERANCIA_PADRAO = 60;

function EditorTrama({
  inicial,
  itens,
  existentes,
  onCancelar,
  onGuardar,
}: {
  inicial: { id?: string; rotulo: string; grupo: Categoria; bits: Desenho; arquivo?: File };
  itens: Item[];
  existentes: TramaNova[];
  onCancelar: () => void;
  onGuardar: (e: { id?: string; rotulo: string; grupo: Categoria; bits: Desenho }) => void;
}) {
  // the design being drawn: 29x29, or the size of an attached picture (no limit)
  const [desenho, setDesenho] = useState<Desenho>(() => ({ ...inicial.bits, bits: inicial.bits.bits.slice() }));
  const { bits, cols, rows } = desenho;
  const setBits = (f: (b: Uint8Array) => Uint8Array) =>
    setDesenho((d) => {
      const n = f(d.bits);
      return n === d.bits ? d : { ...d, bits: n };
    });
  const [rotulo, setRotulo] = useState(inicial.rotulo);
  const [grupo, setGrupo] = useState<Categoria>(inicial.grupo);
  const [fioA, setFioA] = useState<Fio>(FIOS.find((f) => f.cor.toUpperCase() === COR_A) ?? FIOS[0]);
  const [fioB, setFioB] = useState<Fio>(FIOS.find((f) => f.cor.toUpperCase() === COR_B) ?? FIOS[1]);
  const [base, setBase] = useState("");
  const [foto, setFoto] = useState<Imagem | null>(null);
  const [soltando, setSoltando] = useState(false);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pintando = useRef<0 | 1 | null>(null);
  const ultima = useRef(-1);

  // drawing canvas
  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.fillStyle = fioA.cor;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = fioB.cor;
    for (let k = 0; k < bits.length; k++) if (bits[k]) ctx.fillRect((k % cols) * LADO, Math.floor(k / cols) * LADO, LADO, LADO);
    ctx.lineWidth = 1;
    const linha = (x0: number, y0: number, x1: number, y1: number, forte: boolean) => {
      ctx.strokeStyle = forte ? "rgba(200,140,60,0.7)" : "rgba(128,128,128,0.35)";
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    };
    for (let i = 0; i <= cols; i++) linha(i * LADO + 0.5, 0, i * LADO + 0.5, c.height, i === Math.floor(cols / 2) || i === Math.ceil(cols / 2));
    for (let j = 0; j <= rows; j++) linha(0, j * LADO + 0.5, c.width, j * LADO + 0.5, j === Math.floor(rows / 2) || j === Math.ceil(rows / 2));
  }, [bits, cols, rows, fioA, fioB]);

  // the real chair, rendered by the site (backrest + seat), a moment after the last change
  const grade = codificarDesenho(desenho);
  const [previa, setPrevia] = useState("");
  useEffect(() => {
    const q = new URLSearchParams({ f: "foto", fd: grade, fa: "foto", fda: grade, a: fioA.cor.slice(1), b: fioB.cor.slice(1) });
    const id = setTimeout(() => setPrevia(`/api/cadeira?${q}`), 450);
    return () => clearTimeout(id);
  }, [grade, fioA, fioB]);

  const celulaDoPonteiro = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientX - r.left) / r.width) * cols);
    const j = Math.floor(((e.clientY - r.top) / r.height) * rows);
    return i < 0 || j < 0 || i >= cols || j >= rows ? -1 : j * cols + i;
  };
  const pintar = (k: number, v: 0 | 1) => {
    if (k < 0 || k === ultima.current) return;
    ultima.current = k;
    setBits((b) => {
      if (b[k] === v) return b;
      const n = b.slice();
      n[k] = v;
      return n;
    });
  };

  const transformar = (fn: (i: number, j: number, b: Uint8Array) => number) =>
    setBits((b) => {
      const n = new Uint8Array(cols * rows);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) n[j * cols + i] = fn(i, j, b) ? 1 : 0;
      return n;
    });
  const em = (b: Uint8Array, i: number, j: number) => (i < 0 || j < 0 || i >= cols || j >= rows ? 0 : b[j * cols + i]);

  const aplicarFoto = (f: Imagem) => {
    if (f.modo === "pixel" && f.arte) {
      const r = gradeDaPixelArte(f.arte, f.tolerancia, f.inverter);
      setDesenho({ bits: r.bits, cols: r.cols, rows: r.rows });
      setFoto({ ...f, info: { largura: r.largura, altura: r.altura } });
    } else {
      setDesenho({ bits: gradeDaFoto(f.brilho, f.limiar, f.inverter), cols: FOTO_COLS, rows: FOTO_ROWS });
      setFoto({ ...f, info: null });
    }
  };
  const abrirImagem = (arq: File | undefined | null) => {
    if (!arq) return;
    if (!arq.type.startsWith("image/")) return setErro("Esse arquivo não é uma imagem. Use JPG ou PNG.");
    setErro("");
    const url = URL.createObjectURL(arq);
    const img = new Image();
    img.onload = () => {
      const brilho = brilhoDasCelulas(img);
      const arte = lerPixelArte(img);
      setFoto((antes) => {
        if (antes) URL.revokeObjectURL(antes.url);
        return antes;
      });
      aplicarFoto({ url, arte, brilho, modo: arte ? "pixel" : "foto", limiar: limiarAutomatico(brilho), tolerancia: TOLERANCIA_PADRAO, inverter: false, info: null });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setErro("Não deu para abrir essa imagem. Tente uma foto JPG ou PNG.");
    };
    img.src = url;
  };
  // the picture chosen with "Anexar uma imagem" above the list
  const arquivoInicial = useRef(inicial.arquivo);
  useEffect(() => {
    const arq = arquivoInicial.current;
    arquivoInicial.current = undefined;
    if (arq) abrirImagem(arq);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // a copied picture (Ctrl+V) also works while the editor is open
  useEffect(() => {
    const colar = (e: ClipboardEvent) => {
      const arq = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (arq) {
        e.preventDefault();
        abrirImagem(arq);
      }
    };
    window.addEventListener("paste", colar);
    return () => window.removeEventListener("paste", colar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const termoBase = semAcento(base);
  const achados = termoBase.length >= 2 ? itens.filter((f) => semAcento(f.rotulo).includes(termoBase)).slice(0, 12) : [];
  const ligadas = bits.reduce((s, v) => s + v, 0);

  const guardar = () => {
    if (!rotulo.trim()) return setErro("Dê um nome para o traçado (é o que o cliente vê embaixo do desenho).");
    if (ligadas < 3) return setErro("Pinte o desenho na grade antes de guardar.");
    const igual = existentes.find((n) => n.grade === grade && n.id !== inicial.id);
    if (igual) return setErro(`Esse desenho é igual ao "${igual.rotulo}", que você já fez.`);
    onGuardar({ id: inicial.id, rotulo, grupo, bits: desenho });
  };

  const ferramenta = "rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:border-wood";

  return (
    <section className="rounded-3xl border-2 border-espresso bg-paper p-4 shadow-[0_12px_32px_-20px_rgba(36,28,20,0.5)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">{inicial.id ? "Editar traçado" : "Traçado novo"}</h2>
          <p className="mt-1 max-w-prose text-sm text-ink-soft">
            Cada quadradinho é um ponto da trama do encosto. Toque ou arraste para pintar; tocando num ponto pintado, você apaga. No assento ele
            fica no meio.
          </p>
        </div>
        <button type="button" onClick={onCancelar} className={btnSecondary}>
          Cancelar
        </button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,348px)_minmax(0,1fr)_minmax(0,15rem)]">
        <div>
          <canvas
            ref={canvasRef}
            width={cols * LADO}
            height={rows * LADO}
            style={{ aspectRatio: `${cols} / ${rows}`, maxWidth: cols >= rows ? 348 : (348 * cols) / rows }}
            className="w-full cursor-crosshair touch-none rounded-lg border border-line"
            aria-label="Grade para desenhar o traçado"
            onPointerDown={(e) => {
              const k = celulaDoPonteiro(e);
              if (k < 0) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              pintando.current = bits[k] ? 0 : 1;
              ultima.current = -1;
              pintar(k, pintando.current);
            }}
            onPointerMove={(e) => {
              if (pintando.current !== null) pintar(celulaDoPonteiro(e), pintando.current);
            }}
            onPointerUp={() => (pintando.current = null)}
            onPointerCancel={() => (pintando.current = null)}
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button type="button" className={ferramenta} onClick={() => setDesenho(vazio())}>
              Limpar
            </button>
            <button type="button" className={ferramenta} onClick={() => transformar((i, j, b) => 1 - em(b, i, j))}>
              Inverter cores
            </button>
            <button type="button" className={ferramenta} onClick={() => transformar((i, j, b) => (i < cols / 2 ? em(b, i, j) : em(b, cols - 1 - i, j)))}>
              Espelhar esquerda → direita
            </button>
            <button type="button" className={ferramenta} onClick={() => transformar((i, j, b) => em(b, cols - 1 - i, j))}>
              Virar de lado
            </button>
            <button type="button" className={ferramenta} onClick={() => transformar((i, j, b) => em(b, i, rows - 1 - j))}>
              Virar de cabeça para baixo
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
            Mover:
            {(
              [
                ["←", -1, 0],
                ["→", 1, 0],
                ["↑", 0, -1],
                ["↓", 0, 1],
              ] as const
            ).map(([s, di, dj]) => (
              <button key={s} type="button" aria-label={`Mover para ${s}`} className={`${ferramenta} w-9 px-0`} onClick={() => transformar((i, j, b) => em(b, i - di, j - dj))}>
                {s}
              </button>
            ))}
            <span className="ml-1">
              {ligadas} pontos pintados, grade de {cols} × {rows}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div
            className={`rounded-2xl border-2 border-dashed p-3 transition ${soltando ? "border-wood bg-rattan/10" : "border-wood/40 bg-canvas"}`}
            onDragOver={(e) => {
              e.preventDefault();
              setSoltando(true);
            }}
            onDragLeave={() => setSoltando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setSoltando(false);
              abrirImagem(e.dataTransfer.files?.[0]);
            }}
          >
            <input ref={arquivoRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              abrirImagem(e.target.files?.[0]);
              e.target.value = "";
            }} />
            {foto ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foto.url} alt="Imagem anexada" className="h-20 w-20 shrink-0 rounded-lg border border-line bg-paper object-contain [image-rendering:pixelated]" />
                  <div className="min-w-0 text-xs text-ink-soft">
                    {foto.modo === "pixel" && foto.info ? (
                      foto.info.largura ? (
                        <p>
                          <strong className="text-ink">
                            Li o desenho: {foto.info.largura} × {foto.info.altura} pontos.
                          </strong>{" "}
                          {cols !== FOTO_COLS || rows !== FOTO_ROWS
                            ? "Ficou do tamanho da imagem, ponto por ponto: nada foi diminuído nem mudado. Na cadeira ele ocupa a área do desenho."
                            : "Cada quadradinho virou um ponto, no meio da cadeira."}
                        </p>
                      ) : (
                        <p className="text-clay-dark">Não achei desenho nessa imagem. Mexa em &ldquo;Mais pontos&rdquo; ou troque para Foto ou logo.</p>
                      )
                    ) : (
                      <p>
                        <strong className="text-ink">Lida como foto ou logo:</strong> a parte escura vira o desenho.
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      <button type="button" className="font-medium text-wood-dark underline" onClick={() => arquivoRef.current?.click()}>
                        Trocar imagem
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 rounded-full bg-paper p-1" role="group" aria-label="Como ler a imagem">
                  {(
                    [
                      ["pixel", "Pixel / ponto cruz"],
                      ["foto", "Foto ou logo"],
                    ] as const
                  ).map(([m, r]) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={foto.modo === m}
                      disabled={m === "pixel" && !foto.arte}
                      title={m === "pixel" && !foto.arte ? "Não achei quadradinhos nessa imagem" : undefined}
                      onClick={() => aplicarFoto({ ...foto, modo: m })}
                      className={`rounded-full px-2 py-1.5 text-xs font-medium disabled:opacity-40 ${foto.modo === m ? "bg-espresso text-paper" : "text-ink"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <label className="block text-xs text-ink-soft">
                  <span className="flex justify-between">
                    <span>Menos pontos</span>
                    <span>Mais pontos</span>
                  </span>
                  {foto.modo === "pixel" ? (
                    <input
                      type="range"
                      min={10}
                      max={200}
                      value={210 - foto.tolerancia}
                      onChange={(e) => aplicarFoto({ ...foto, tolerancia: 210 - Number(e.target.value) })}
                      className="mt-1 w-full accent-wood"
                    />
                  ) : (
                    <input
                      type="range"
                      min={10}
                      max={245}
                      value={foto.limiar}
                      onChange={(e) => aplicarFoto({ ...foto, limiar: Number(e.target.value) })}
                      className="mt-1 w-full accent-wood"
                    />
                  )}
                </label>
                <label className="flex items-center gap-2 text-xs text-ink">
                  <input type="checkbox" checked={foto.inverter} onChange={(e) => aplicarFoto({ ...foto, inverter: e.target.checked })} />
                  {foto.modo === "pixel" ? "Trocar: o fundo vira o desenho" : "Usar a parte clara da imagem"}
                </label>
              </div>
            ) : (
              <button type="button" onClick={() => arquivoRef.current?.click()} className="flex w-full items-center gap-3 text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-wood to-espresso text-lg text-paper" aria-hidden>
                  📎
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">Anexar imagem</span>
                  <span className="block text-xs text-ink-soft">Pixel ou ponto cruz. Toque, arraste a imagem para cá ou cole (Ctrl+V).</span>
                </span>
              </button>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-medium text-ink">Nome do traçado</span>
            <input value={rotulo} maxLength={40} onChange={(e) => setRotulo(e.target.value)} placeholder="Ex.: Âncora com corda" className={`${inputClass} mt-1`} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Em qual aba ele aparece</span>
            <select value={grupo} onChange={(e) => setGrupo(e.target.value as Categoria)} className={`${inputClass} mt-1`}>
              {CATEGORIAS.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.rotulo}
                </option>
              ))}
            </select>
          </label>

          <details className="rounded-2xl border border-line bg-canvas px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-ink">Começar de um traçado que já existe</summary>
            <input value={base} onChange={(e) => setBase(e.target.value)} placeholder="Buscar (ex.: coração)" className={`${inputClass} mt-3`} />
            {achados.length ? (
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {achados.map((f) => (
                  <li key={f.valor}>
                    <button type="button" onClick={() => setDesenho(bitsDe(f))} className="w-full rounded-xl border border-line bg-paper p-1 text-left text-[0.7rem] leading-tight text-ink hover:border-wood">
                      <Miniatura item={f} corA={fioA.cor} corB={fioB.cor} />
                      <span className="mt-1 block">{f.rotulo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : termoBase.length >= 2 ? (
              <p className="mt-2 text-xs text-ink-soft">Nenhum com esse nome.</p>
            ) : null}
          </details>


          <div>
            <p className="text-sm font-medium text-ink">Cores só para ver</p>
            <p className="text-xs text-ink-soft">O cliente escolhe as cores dele no site.</p>
            {(
              [
                ["Principal", fioA, setFioA],
                ["Detalhe (o desenho)", fioB, setFioB],
              ] as const
            ).map(([nome, atual, set]) => (
              <div key={nome} className="mt-2">
                <p className="text-xs text-ink-soft">
                  {nome}: <span className="text-ink">{atual.nome}</span>
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {FIOS.map((f) => (
                    <button
                      key={f.nome}
                      type="button"
                      title={f.nome}
                      aria-label={f.nome}
                      aria-pressed={atual.nome === f.nome}
                      onClick={() => set(f)}
                      className={`h-6 w-6 rounded-full border ${atual.nome === f.nome ? "ring-2 ring-wood ring-offset-1" : "border-line"}`}
                      style={{ background: f.cor }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Como fica na cadeira</p>
          {previa ? (
            // eslint-disable-next-line @next/next/no-img-element -- server-rendered PNG of the chair
            <img src={previa} alt="Prévia da cadeira com o traçado" width={464} height={560} className="mt-2 w-full rounded-2xl border border-line bg-canvas" />
          ) : (
            <div className="mt-2 aspect-[464/560] w-full animate-pulse rounded-2xl bg-canvas" />
          )}
        </div>
      </div>

      {erro ? (
        <p role="alert" className="mt-4 rounded-xl bg-clay/10 px-4 py-2.5 text-sm text-clay">
          {erro}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancelar} className={btnSecondary}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => {
            setErro("");
            guardar();
          }}
          className="inline-flex items-center gap-2 rounded-full bg-espresso px-5 py-2.5 text-sm font-semibold text-paper hover:bg-espresso-soft"
        >
          {inicial.id ? "Guardar mudanças" : "Guardar traçado"}
        </button>
      </div>
      <p className="mt-2 text-right text-xs text-ink-soft">Depois, toque em &ldquo;Publicar no site&rdquo; lá embaixo.</p>
    </section>
  );
}
