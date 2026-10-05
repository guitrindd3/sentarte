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
};

const sem = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function GradeModelos({ catId, modelos }: { catId: string; modelos: Item[] }) {
  const [q, setQ] = useState("");
  const lista = q ? modelos.filter((m) => sem(`${m.nome} ${m.grupo ?? ""}`).includes(sem(q))) : modelos;

  return (
    <div>
      {modelos.length > 6 ? (
        <div className="mb-5">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Procurar cadeira pelo nome (ex.: Flamengo, boho, Sol…)"
            className={inputClass}
          />
        </div>
      ) : null}

      {lista.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">{q ? `Nenhuma cadeira com "${q}".` : "Nenhum modelo ainda."}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {lista.map((m) => (
            <li key={m.id}>
              <Link
                href={`/admin/catalogo/${catId}/${m.id}`}
                className="group block overflow-hidden rounded-xl border border-line/70 bg-paper transition hover:-translate-y-0.5 hover:border-wood hover:shadow-[5px_5px_0_0_var(--rattan)]"
              >
                <div className="relative aspect-square overflow-hidden bg-canvas-deep">
                  {m.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.foto} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="h-full w-full opacity-80">
                      <WeavePattern colorA={m.corA} colorB={m.corB} cell={28} band={18} className="h-full w-full" />
                    </div>
                  )}
                  {!m.foto && !m.capa ? (
                    <span className="absolute inset-x-2 bottom-2 rounded-full bg-clay px-2 py-0.5 text-center text-[0.7rem] font-semibold text-paper">
                      Sem foto
                    </span>
                  ) : null}
                  {m.grupo ? (
                    <span className="absolute left-2 top-2 rounded-full bg-paper/90 px-2 py-0.5 text-[0.7rem] font-semibold text-ink shadow-sm">
                      {m.grupo}
                    </span>
                  ) : null}
                  {m.nFotos > 1 ? (
                    <span className="absolute right-2 top-2 rounded-full bg-espresso/80 px-2 py-0.5 text-[0.7rem] font-semibold text-paper">
                      {m.nFotos} fotos
                    </span>
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="truncate font-semibold text-ink group-hover:text-wood-dark">{m.nome}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">{m.descricao || "Sem descrição"}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
