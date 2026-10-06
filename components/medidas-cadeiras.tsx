import { MEDIDAS_CADEIRAS, OBS_RECLINAVEL } from "@/lib/medidas";
import { whatsappUrl } from "@/lib/urls";

// "Medidas e especificações": the three chair frames side by side (sizes,
// weight capacity, chair weight), from the atelier's own spec card.
// `embutido`: compact version inside another block (the /personalizar header,
// under its text — user 2026-10-06), where the type is chosen in the builder,
// so no "fale no WhatsApp" line.
export function MedidasCadeiras({ whatsappNumero, embutido = false }: { whatsappNumero: string; embutido?: boolean }) {
  if (embutido) {
    const lista = (
      <>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
          {MEDIDAS_CADEIRAS.map((m) => (
            <li key={m.nome} className="border border-line bg-paper p-4">
              <p className="font-serif text-base font-medium tracking-tight text-ink">{m.nome}</p>
              <p className="text-xs text-ink-soft">{m.detalhe || " "}</p>
              <dl className="mt-3 space-y-1.5 text-xs">
                {linhas(m).map(([rotulo, valor]) => (
                  <div key={rotulo} className="flex justify-between gap-2 border-b border-line pb-1.5 last:border-0 last:pb-0">
                    <dt className="text-ink-soft">{rotulo}</dt>
                    <dd className="text-right font-medium text-ink">{valor}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-soft">{OBS_RECLINAVEL}</p>
      </>
    );
    return (
      <>
        {/* Phones: folded, so the builder isn't pushed far down. */}
        <details className="group mt-6 border border-line bg-paper px-4 py-3 md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-lg font-medium tracking-tight text-ink">
            Medidas e especificações
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line font-sans text-lg leading-none transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-2 text-xs text-ink-soft">Estrutura em alumínio e trançado em corda náutica. Medidas da cadeira aberta.</p>
          {lista}
        </details>
        <div className="mt-8 hidden md:block">
          <h2 className="font-serif text-xl font-medium tracking-tight text-ink">Medidas e especificações</h2>
          <p className="mt-1 text-xs text-ink-soft">Estrutura em alumínio e trançado em corda náutica. Medidas da cadeira aberta.</p>
          {lista}
        </div>
      </>
    );
  }
  return (
    <section className="border-t border-line bg-paper px-6 py-14" aria-labelledby="titulo-medidas">
      <div className="mx-auto max-w-6xl">
        <h2 id="titulo-medidas" className="font-serif text-2xl font-medium tracking-tight text-ink md:text-3xl">
          Medidas e especificações
        </h2>
        <p className="mt-2 max-w-[60ch] text-sm text-ink-soft">
          Estrutura em alumínio e trançado em corda náutica. Medidas da cadeira aberta.
        </p>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {MEDIDAS_CADEIRAS.map((m) => (
            <li key={m.nome} className="border border-line bg-canvas p-5">
              <p className="font-serif text-xl font-medium tracking-tight text-ink">{m.nome}</p>
              {m.detalhe ? <p className="text-sm text-ink-soft">{m.detalhe}</p> : <p className="text-sm text-ink-soft">&nbsp;</p>}
              <dl className="mt-4 space-y-2 text-sm">
                {linhas(m).map(([rotulo, valor]) => (
                  <div key={rotulo} className="flex justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                    <dt className="text-ink-soft">{rotulo}</dt>
                    <dd className="font-medium text-ink">{valor}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-ink-soft">
          {OBS_RECLINAVEL} Quer a infantil ou a reclinável?{" "}
          <a
            href={whatsappUrl(whatsappNumero, "Oi! Quero saber mais sobre a cadeira infantil / reclinável.")}
            target="_blank"
            rel="noreferrer"
            className="text-ink underline underline-offset-2 hover:text-ink-soft"
          >
            Fale com a gente no WhatsApp
          </a>{" "}
          para ver todas as opções.
        </p>
      </div>
    </section>
  );
}

function linhas(m: (typeof MEDIDAS_CADEIRAS)[number]): [string, string][] {
  return [
    ["Altura", m.altura],
    ["Largura", m.largura],
    ["Profundidade", m.profundidade],
    ["Aguenta", m.capacidade],
    ...(m.peso ? [["Peso da cadeira", m.peso] as [string, string]] : []),
  ];
}
