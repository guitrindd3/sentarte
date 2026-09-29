"use client";

import Link from "next/link";
import { useState } from "react";
import { ChairPreview, NOME_MAX_CHARS_POR_LINHA } from "@/components/chair-preview";
import { FIOS } from "@/lib/palette";

// Homepage teaser for /personalizar: type a name, see it on the chair right
// away. No competitor we looked at (2026-09-29) offers a live preview, so it
// gets a prominent spot instead of only being linked from the catalog.
const COMBINACOES = [
  { a: FIOS[0], b: FIOS[4] },
  { a: FIOS[1], b: FIOS[4] },
  { a: FIOS[3], b: FIOS[5] },
  { a: FIOS[9], b: FIOS[4] },
];

export function PreviewPromo() {
  const [nome, setNome] = useState("");
  const [combo, setCombo] = useState(0);
  const { a, b } = COMBINACOES[combo];

  return (
    <section className="border-t border-line px-6 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-ink">
            Veja a sua cadeira antes de pedir
          </h2>
          <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-ink-soft">
            Escreva um nome, troque as cores e veja na hora como fica. No montador completo você
            escolhe também a forma do trançado e onde o nome entra no encosto.
          </p>

          <label className="mt-8 block max-w-xs">
            <span className="text-xs text-ink-soft">Nome ou apelido</span>
            <input
              type="text"
              value={nome}
              maxLength={NOME_MAX_CHARS_POR_LINHA}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Praia da Ju"
              className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </label>

          <div className="mt-4" role="group" aria-label="Cores">
            <span className="text-xs text-ink-soft">Cores</span>
            <div className="mt-1 flex gap-2">
              {COMBINACOES.map((c, i) => (
                <button
                  key={c.a.nome + c.b.nome}
                  type="button"
                  onClick={() => setCombo(i)}
                  aria-label={`${c.a.nome} e ${c.b.nome}`}
                  aria-pressed={combo === i}
                  className={`flex h-9 w-9 overflow-hidden border-2 ${combo === i ? "border-ink" : "border-line hover:border-ink"}`}
                >
                  <span className="h-full w-1/2" style={{ background: c.a.cor }} />
                  <span className="h-full w-1/2" style={{ background: c.b.cor }} />
                </button>
              ))}
            </div>
          </div>

          <Link
            href="/personalizar"
            className="mt-8 inline-block border border-ink bg-ink px-6 py-3 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink"
          >
            Montar a minha cadeira
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm border border-line bg-paper p-8">
          <ChairPreview colorA={a.cor} colorB={b.cor} shape="lisa" nome={nome} />
        </div>
      </div>
    </section>
  );
}
