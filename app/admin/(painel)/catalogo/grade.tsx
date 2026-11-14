"use client";

import Link from "next/link";
import { useState } from "react";
import { WeavePattern } from "@/components/weave-pattern";
import { inputClass } from "../../_ui";

type Item = {
  id: string;
  nome: string;
  descricao: string;
  foto?: string;
  corA: string;
  corB: string;
  nFotos: number;
  grupo?: string;
  capa?: boolean;
  /** Place in the category (same order as the site). */
  posicao: number;
  /** Where it shows on the site (product page or collection page); none for hidden categories. */
  noSite?: string;
};

const sem = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function GradeModelos({ catId, modelos }: { catId: string; modelos: Item[] }) {
  const [q, setQ] = useState("");
  const lista = q ? modelos.filter((m) => sem(`${m.nome} ${m.grupo ?? ""}`).includes(sem(q))) : modelos;

  return (
    <div>
      {modelos.length > 6 ? (
        <div className="mb-4">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Procurar cadeira pelo nome (ex.: Flamengo, boho, Sol…)"
            aria-label="Procurar cadeira"
            className={inputClass}
          />
        </div>
      ) : null}

      {lista.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-paper px-5 py-8 text-center text-sm text-ink-soft">
          {q ? `Nenhuma cadeira com "${q}".` : "Nenhum modelo aqui."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {lista.map((m) => {
            const editar = `/admin/catalogo/${catId}/${m.id}`;
            const semFoto = !m.foto && !m.capa;
            return (
              <li key={m.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-[0_1px_2px_rgba(36,31,26,0.05)] transition hover:border-wood">
                <Link href={editar} className="group block">
                  <div className="relative aspect-square overflow-hidden bg-canvas-deep">
                    {m.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.foto} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="h-full w-full opacity-80">
                        <WeavePattern colorA={m.corA} colorB={m.corB} cell={28} band={18} className="h-full w-full" />
                      </div>
                    )}
                    {m.grupo ? (
                      <span className="absolute left-2 top-2 rounded-full bg-espresso/85 px-2 py-0.5 text-xs font-semibold text-rattan">{m.grupo}</span>
                    ) : null}
                    {semFoto ? (
                      <span className="absolute inset-x-2 bottom-2 rounded-full bg-clay px-2 py-0.5 text-center text-xs font-semibold text-paper">Sem foto</span>
                    ) : null}
                  </div>
                  <div className="px-3 pb-2 pt-2.5">
                    <p className="truncate font-semibold text-ink group-hover:text-wood-dark">{m.nome}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">{m.descricao || "Sem descrição"}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {m.posicao}º na ordem
                      {m.nFotos > 1 ? `, ${m.nFotos} fotos` : ""}
                    </p>
                  </div>
                </Link>
                <div className="mt-auto flex items-center gap-1.5 border-t border-line/60 px-2 py-2">
                  <Link
                    href={editar}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-espresso px-3 py-1.5 text-sm font-semibold text-paper hover:bg-espresso-soft"
                  >
                    Editar
                  </Link>
                  {m.noSite ? (
                    <a
                      href={m.noSite}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Ver ${m.nome} no site`}
                      title="Ver no site"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-ink-soft hover:border-wood hover:text-wood-dark"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
                        <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
