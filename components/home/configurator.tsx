"use client";

import { useMemo, useState } from "react";
import { FramedWeave } from "@/components/framed-weave";
import { WhatsAppIcon } from "@/components/icons";
import { FIOS } from "@/lib/palette";
import { whatsappUrl } from "@/lib/urls";
import type { WeaveShape } from "@/components/weave-pattern";
import type { Categoria } from "@/lib/content-schema";

const FORMAS: { valor: WeaveShape; rotulo: string }[] = [
  { valor: "lisa", rotulo: "Lisa" },
  { valor: "diamante", rotulo: "Diamante" },
  { valor: "ziguezague", rotulo: "Ziguezague" },
  { valor: "espiral", rotulo: "Triângulo caracol" },
  { valor: "sol", rotulo: "Sol" },
];

export function Configurator({
  categorias,
  whatsappNumero,
}: {
  categorias: Categoria[];
  whatsappNumero: string;
}) {
  const modelos = categorias.map((c) => c.titulo);
  const [modelo, setModelo] = useState(modelos[0] ?? "");
  const [fioA, setFioA] = useState(FIOS[0]);
  const [fioB, setFioB] = useState(FIOS[1]);
  const [forma, setForma] = useState<WeaveShape>("lisa");
  const [frase, setFrase] = useState("");

  const formaRotulo = FORMAS.find((f) => f.valor === forma)?.rotulo ?? "Lisa";

  const mensagem = useMemo(() => {
    let msg = `Oi! Montei uma trama no site e quero pedir um orçamento:\n\nModelo: ${modelo}\nForma: ${formaRotulo}\nCores: ${fioA.nome} + ${fioB.nome}`;
    if (frase.trim()) msg += `\nFrase para trançar: "${frase.trim()}"`;
    return msg;
  }, [modelo, formaRotulo, fioA, fioB, frase]);

  if (modelos.length === 0) return null;

  return (
    <div className="border border-line bg-paper p-6">
      <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">Monte a sua trama</h2>
      <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-ink-soft">
        Escolha o modelo, a forma e as cores para ver uma prévia da trama. Quando estiver do seu
        jeito, mande direto pra gente pelo WhatsApp.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
        <div className="space-y-7">
          <fieldset>
            <legend className="font-serif text-base text-ink">Modelo</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {modelos.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModelo(m)}
                  aria-pressed={modelo === m}
                  className={`border px-3 py-1.5 text-sm transition-colors ${
                    modelo === m ? "border-ink bg-ink text-canvas" : "border-line text-ink-soft hover:border-ink"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-serif text-base text-ink">Forma do trançado</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {FORMAS.map((f) => (
                <button
                  key={f.valor}
                  type="button"
                  onClick={() => setForma(f.valor)}
                  aria-pressed={forma === f.valor}
                  className={`border px-3 py-1.5 text-sm transition-colors ${
                    forma === f.valor ? "border-ink bg-ink text-canvas" : "border-line text-ink-soft hover:border-ink"
                  }`}
                >
                  {f.rotulo}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-serif text-base text-ink">Primeiro fio</legend>
            <div className="mt-3 flex flex-wrap gap-3">
              {FIOS.map((fio) => (
                <button
                  key={fio.nome}
                  type="button"
                  aria-label={fio.nome}
                  aria-pressed={fioA.nome === fio.nome}
                  onClick={() => setFioA(fio)}
                  className={`h-9 w-9 rounded-full transition-shadow ${
                    fioA.nome === fio.nome
                      ? "ring-2 ring-ink ring-offset-2 ring-offset-paper"
                      : "ring-1 ring-line ring-offset-2 ring-offset-paper hover:ring-ink"
                  }`}
                  style={{ background: fio.cor }}
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-serif text-base text-ink">Segundo fio</legend>
            <div className="mt-3 flex flex-wrap gap-3">
              {FIOS.map((fio) => (
                <button
                  key={fio.nome}
                  type="button"
                  aria-label={fio.nome}
                  aria-pressed={fioB.nome === fio.nome}
                  onClick={() => setFioB(fio)}
                  className={`h-9 w-9 rounded-full transition-shadow ${
                    fioB.nome === fio.nome
                      ? "ring-2 ring-ink ring-offset-2 ring-offset-paper"
                      : "ring-1 ring-line ring-offset-2 ring-offset-paper hover:ring-ink"
                  }`}
                  style={{ background: fio.cor }}
                />
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="frase" className="font-serif text-base text-ink">
              Uma frase para trançar (opcional)
            </label>
            <input
              id="frase"
              type="text"
              value={frase}
              onChange={(e) => setFrase(e.target.value.slice(0, 28))}
              placeholder="Ex.: Família Silva"
              className="mt-3 w-full border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ink"
            />
          </div>

          <a
            href={whatsappUrl(whatsappNumero, mensagem)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-ink bg-ink px-6 py-3 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Pedir esse orçamento
          </a>
        </div>

        <div>
          <FramedWeave
            colorA={fioA.cor}
            colorB={fioB.cor}
            shape={forma}
            cell={40}
            band={27}
            aspect="aspect-square"
            tone="canvas"
          />
          <p className="mt-3 text-sm text-ink-soft">
            {modelo} em {fioA.nome.toLowerCase()} e {fioB.nome.toLowerCase()}, trançado {formaRotulo.toLowerCase()}.
          </p>
        </div>
      </div>
    </div>
  );
}
