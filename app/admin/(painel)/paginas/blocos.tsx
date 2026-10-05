"use client";

import { useState } from "react";
import type { Bloco } from "@/lib/textos-paginas";
import { inputClass } from "../../_ui";

let seq = 0;
const comId = (b: Bloco) => ({ ...b, _id: ++seq });

/**
 * List of {título, texto} items (FAQ questions, policy sections, steps).
 * Posts `${name}.titulo` / `${name}.texto` pairs in order.
 */
export function EditorBlocos({
  name,
  inicial,
  rotulos,
  fixo = false,
}: {
  name: string;
  inicial: Bloco[];
  rotulos: [string, string];
  fixo?: boolean;
}) {
  const [itens, setItens] = useState(() => inicial.map(comId));
  const mudou = () => document.getElementById(`blocos-${name}`)?.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }));
  const mover = (i: number, d: number) => {
    setItens((l) => {
      const n = [...l];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });
    mudou();
  };

  return (
    <div id={`blocos-${name}`} className="space-y-3">
      {itens.map((b, i) => (
        <div key={b._id} className="rounded-xl border border-line/70 bg-canvas/60 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-ink-soft">{i + 1}</span>
            {!fixo ? (
              <span className="flex gap-1 text-xs">
                <button type="button" disabled={i === 0} onClick={() => mover(i, -1)} className="rounded-full px-2 py-1 text-ink-soft hover:bg-paper hover:text-ink disabled:opacity-30" aria-label="Subir">
                  ↑
                </button>
                <button type="button" disabled={i === itens.length - 1} onClick={() => mover(i, 1)} className="rounded-full px-2 py-1 text-ink-soft hover:bg-paper hover:text-ink disabled:opacity-30" aria-label="Descer">
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItens((l) => l.filter((x) => x._id !== b._id));
                    mudou();
                  }}
                  className="rounded-full px-2 py-1 font-medium text-clay hover:bg-clay/10"
                >
                  Tirar
                </button>
              </span>
            ) : null}
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-ink">{rotulos[0]}</span>
            <input name={`${name}.titulo`} defaultValue={b.titulo} maxLength={200} className={`mt-1 ${inputClass}`} />
          </label>
          <label className="mt-3 block">
            <span className="text-xs font-semibold text-ink">{rotulos[1]}</span>
            <textarea name={`${name}.texto`} defaultValue={b.texto} rows={Math.min(8, Math.max(2, Math.ceil(b.texto.length / 90)))} maxLength={3000} className={`mt-1 ${inputClass}`} />
          </label>
        </div>
      ))}
      {!fixo ? (
        <button
          type="button"
          onClick={() => {
            setItens((l) => [...l, comId({ titulo: "", texto: "" })]);
            mudou();
          }}
          className="w-full rounded-xl border-2 border-dashed border-line px-4 py-3 text-sm font-semibold text-ink-soft transition hover:border-wood hover:text-wood-dark"
        >
          + Adicionar {rotulos[0].toLowerCase()}
        </button>
      ) : null}
    </div>
  );
}
