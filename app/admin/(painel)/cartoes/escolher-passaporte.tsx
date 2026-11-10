"use client";

import { useState } from "react";
import { inputClass } from "../../_ui";
import type { Passaporte } from "./folha";

// "Como vou saber qual passaporte é? quero opções de qual passaporte vai na
// cadeira e eu escolho" (2026-11-10): every chair with a passport shown with
// its photo, model, woven name, colors, buyer (first name + city) and order
// code, searchable, so the atelier picks the tag for the chair in her hands.

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function textoDoPassaporte(p: Passaporte) {
  return [p.modelo, p.nomeTrancado ? `“${p.nomeTrancado}”` : "", p.tipo].filter(Boolean).join(" · ");
}

export function FotoPassaporte({ p, tam = 56 }: { p: Passaporte; tam?: number }) {
  return (
    <div className="relative shrink-0 overflow-hidden rounded-xl border border-line/70 bg-canvas-deep" style={{ width: tam, height: tam }}>
      {p.imagem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.imagem} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-xs text-ink-soft">sem foto</div>
      )}
    </div>
  );
}

/** One chair, all the clues to recognise it. */
export function LinhaPassaporte({ p, acao }: { p: Passaporte; acao?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
      <FotoPassaporte p={p} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-tight text-ink">
          Nº {p.numero} <span className="font-normal text-ink-soft">·</span> {p.modelo ?? p.rotulo}
        </p>
        <p className="mt-0.5 text-sm text-ink">
          {p.nomeTrancado ? (
            <>
              Nome trançado: <strong>{p.nomeTrancado}</strong>
            </>
          ) : (
            <span className="text-ink-soft">Sem nome trançado</span>
          )}
          {p.tipo ? <span className="text-ink-soft"> · {p.tipo}</span> : null}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
          {p.cores?.length ? (
            <span className="inline-flex items-center gap-1" title="Cores da cadeira">
              {p.cores.map((cor) => (
                <span key={cor} className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-ink/20" style={{ background: cor }} />
              ))}
            </span>
          ) : null}
          {p.cliente ? <span>Cliente: {p.cliente}</span> : null}
          {p.pedido ? <span>Pedido {p.pedido}</span> : null}
          <span>{p.dia}</span>
          {p.colecao ? <span>{p.colecao}</span> : null}
        </p>
      </div>
      {acao ? <div className="w-full sm:w-auto">{acao}</div> : null}
    </div>
  );
}

/** Searchable list of passports; `acao` renders the button for each one. */
export function ListaPassaportes({
  passaportes,
  acao,
  marcado,
}: {
  passaportes: Passaporte[];
  acao: (p: Passaporte) => React.ReactNode;
  marcado?: number | null;
}) {
  const [busca, setBusca] = useState("");
  const termo = semAcento(busca.trim());
  const lista = termo
    ? passaportes.filter((p) =>
        semAcento([p.numero, String(p.n), p.modelo, p.nomeTrancado, p.cliente, p.pedido, p.tipo, p.colecao, p.rotulo].filter(Boolean).join(" ")).includes(
          termo,
        ),
      )
    : passaportes;
  return (
    <div>
      {passaportes.length > 4 ? (
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por número, modelo, nome trançado, cliente ou pedido"
          className={inputClass + " mb-3"}
          aria-label="Buscar passaporte"
        />
      ) : null}
      {lista.length ? (
        <ul className="divide-y divide-line/70">
          {lista.map((p) => (
            <li key={p.n} className={"rounded-xl px-2 py-3 " + (marcado === p.n ? "bg-rattan/15 ring-2 ring-wood" : "")}>
              <LinhaPassaporte p={p} acao={acao(p)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-soft">Nenhuma cadeira encontrada com “{busca}”.</p>
      )}
    </div>
  );
}
