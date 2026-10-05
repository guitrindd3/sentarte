"use client";

import { useRef, useState } from "react";
import { AjustarFoto } from "../../ajustar-foto";
import { avisar } from "../../_ui";

type Item = { id: number; url: string; f?: File };
let seq = 0;

/**
 * Ordered list of photos (homepage carousel): add, remove, reorder, adjust.
 * Posts `${name}.ordem` (JSON tokens "u:<url>" | "n:<k>") and the new files
 * in `${name}.novos`, in order.
 */
export function EditorFotos({ name, inicial, max }: { name: string; inicial: string[]; max: number }) {
  const [itens, setItens] = useState<Item[]>(() => inicial.map((url) => ({ id: ++seq, url })));
  const [ajustando, setAjustando] = useState<Item | null>(null);
  const arquivos = useRef<HTMLInputElement>(null);
  const escolher = useRef<HTMLInputElement>(null);

  const novos = itens.filter((i) => i.f);
  const ordem = JSON.stringify(itens.map((i) => (i.f ? `n:${novos.indexOf(i)}` : `u:${i.url}`)));

  const aplicar = (lista: Item[]) => {
    setItens(lista);
    const dt = new DataTransfer();
    lista.filter((i) => i.f).forEach((i) => dt.items.add(i.f!));
    if (arquivos.current) arquivos.current.files = dt.files;
    arquivos.current?.form?.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const adicionar = (fs: File[]) => {
    const espaco = max - itens.length;
    if (espaco <= 0) return avisar("info", `O limite é ${max} fotos.`);
    const novas = fs.filter((f) => f.type.startsWith("image/")).slice(0, espaco).map((f) => ({ id: ++seq, url: URL.createObjectURL(f), f }));
    aplicar([...itens, ...novas]);
  };

  const mover = (i: number, d: number) => {
    const l = [...itens];
    [l[i], l[i + d]] = [l[i + d], l[i]];
    aplicar(l);
  };

  return (
    <div>
      <input type="hidden" name={`${name}.ordem`} value={ordem} />
      <input ref={arquivos} type="file" name={`${name}.novos`} multiple className="sr-only" tabIndex={-1} aria-hidden />
      <input
        ref={escolher}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) adicionar(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((it, i) => (
          <li key={it.id} className="overflow-hidden rounded-xl border border-line/70 bg-canvas">
            <div className="relative aspect-video bg-canvas-deep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt="" className="h-full w-full object-cover" />
              <span className="absolute left-2 top-2 rounded-full bg-espresso/80 px-2 py-0.5 text-[0.7rem] font-semibold text-paper">{i + 1}</span>
              {it.f ? <span className="absolute right-2 top-2 rounded-full bg-verde px-2 py-0.5 text-[0.7rem] font-semibold text-paper">Nova</span> : null}
            </div>
            <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 text-xs font-medium">
              <button type="button" disabled={i === 0} onClick={() => mover(i, -1)} className="rounded-full px-2 py-1 text-ink-soft hover:bg-paper hover:text-ink disabled:opacity-30" aria-label="Mais para o começo">
                ←
              </button>
              <button type="button" disabled={i === itens.length - 1} onClick={() => mover(i, 1)} className="rounded-full px-2 py-1 text-ink-soft hover:bg-paper hover:text-ink disabled:opacity-30" aria-label="Mais para o fim">
                →
              </button>
              <button type="button" onClick={() => setAjustando(it)} className="rounded-full px-2 py-1 text-wood-dark hover:bg-paper">
                Ajustar
              </button>
              <button
                type="button"
                disabled={itens.length === 1}
                onClick={() => aplicar(itens.filter((x) => x.id !== it.id))}
                className="ml-auto rounded-full px-2 py-1 text-clay hover:bg-clay/10 disabled:opacity-30"
              >
                Tirar
              </button>
            </div>
          </li>
        ))}
        {itens.length < max ? (
          <li>
            <button
              type="button"
              onClick={() => escolher.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                adicionar(Array.from(e.dataTransfer.files));
              }}
              className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-canvas text-sm font-medium text-ink-soft transition hover:border-wood hover:text-wood-dark"
            >
              <span className="text-2xl leading-none">+</span>
              Adicionar fotos
            </button>
          </li>
        ) : null}
      </ol>
      <p className="mt-2 text-xs text-ink-soft">
        {itens.length} de {max} fotos. Use as setas para mudar a ordem.
      </p>
      {ajustando ? (
        <AjustarFoto
          src={ajustando.url}
          formatoInicial="larga"
          onCancelar={() => setAjustando(null)}
          onPronto={(f, previa) => {
            aplicar(itens.map((x) => (x.id === ajustando.id ? { id: x.id, url: previa, f } : x)));
            setAjustando(null);
          }}
        />
      ) : null}
    </div>
  );
}
