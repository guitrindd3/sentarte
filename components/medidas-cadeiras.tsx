import { MEDIDAS_CADEIRAS, OBS_RECLINAVEL } from "@/lib/medidas";
import { whatsappUrl } from "@/lib/urls";

// "Medidas e especificações": the three chair frames side by side (sizes,
// weight capacity, chair weight), from the atelier's own spec card.
export function MedidasCadeiras({ whatsappNumero }: { whatsappNumero: string }) {
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
                {[
                  ["Altura", m.altura],
                  ["Largura", m.largura],
                  ["Profundidade", m.profundidade],
                  ["Aguenta", m.capacidade],
                  ...(m.peso ? [["Peso da cadeira", m.peso]] : []),
                ].map(([rotulo, valor]) => (
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
