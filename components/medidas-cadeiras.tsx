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
    // Compact (user 2026-11-23: "tem muito espaço, tira um pouco"): less padding,
    // the frame detail beside the name, tighter rows.
    <section className="border-t border-line bg-paper px-6 py-9 md:py-10" aria-labelledby="titulo-medidas">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
          <h2 id="titulo-medidas" className="font-serif text-2xl font-medium tracking-tight text-ink md:text-3xl">
            Medidas e especificações
          </h2>
          <p className="text-sm text-ink-soft">Estrutura em alumínio e trançado em corda náutica. Medidas da cadeira aberta.</p>
        </div>
        <ul className="mt-5 grid gap-4 md:grid-cols-3">
          {MEDIDAS_CADEIRAS.map((m) => (
            <li key={m.nome} className="border border-line bg-canvas px-5 py-4">
              <p className="flex items-baseline gap-2 font-serif text-lg font-medium tracking-tight text-ink">
                {m.nome}
                {m.detalhe ? <span className="font-sans text-xs font-normal tracking-normal text-ink-soft">{m.detalhe}</span> : null}
              </p>
              <dl className="mt-2.5 space-y-1 text-sm">
                {linhas(m).map(([rotulo, valor]) => (
                  <div key={rotulo} className="flex justify-between gap-3 border-b border-line pb-1 last:border-0 last:pb-0">
                    <dt className="text-ink-soft">{rotulo}</dt>
                    <dd className="font-medium text-ink">{valor}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-soft">
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
