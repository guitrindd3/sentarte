import { AzevinhoNatal } from "@/components/natal";
import { CintilanteAnoNovo } from "@/components/ano-novo";

const STEPS = [
  {
    numero: "1",
    titulo: "Escolha o modelo",
    texto: "De time, boho, com desenho ou uma trama montada do seu jeito.",
  },
  {
    numero: "2",
    titulo: "Escolha a cor e a trama",
    texto: "Cores sólidas, mescladas ou as cores do time do coração.",
  },
  {
    numero: "3",
    titulo: "Adicione uma personalização",
    texto: "Frase, nome ou símbolo, quando o modelo permitir.",
  },
  {
    numero: "4",
    titulo: "Confirme o resumo",
    texto: "Você revê tudo pelo WhatsApp antes de fechar. Em até 5 dias úteis ela fica pronta e segue para a sua casa.",
  },
];

export function PersonalizationSteps({
  titulo = "Como funciona a personalização",
  passos,
}: {
  titulo?: string;
  passos?: { titulo: string; texto: string }[];
}) {
  const lista = passos?.length ? passos.map((p, i) => ({ ...p, numero: String(i + 1) })) : STEPS;
  return (
    // Compact (user 2026-11-23: "deixa isso aqui menor, tá ocupando muito espaço"):
    // number beside the step title, 2 per row on phones, less padding.
    <section className="bg-canvas-deep px-4 py-7 sm:px-6 md:py-9">
      <div className="mx-auto max-w-6xl">
        {/* December: holly on both sides of the title (2026-11-25) */}
        <h2 className="flex items-center justify-center gap-3 text-center font-serif text-2xl font-medium tracking-[0.06em] text-ink md:text-[1.7rem]">
          <AzevinhoNatal className="hidden h-6 w-9 shrink-0 -scale-x-100 sm:block" />
          <CintilanteAnoNovo className="hidden h-6 w-9 shrink-0 -scale-x-100 sm:block" />
          {titulo}
          <AzevinhoNatal className="hidden h-6 w-9 shrink-0 sm:block" />
          <CintilanteAnoNovo className="hidden h-6 w-9 shrink-0 sm:block" />
        </h2>
        <ol className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5 md:grid-cols-4 md:gap-x-0">
          {lista.map((step, i) => (
            <li key={step.numero} className={i === 0 ? "md:pr-6" : "md:border-l md:border-line md:px-6"}>
              <p className="flex items-baseline gap-2 font-serif font-medium tracking-tight text-ink">
                <span className="text-xl">{step.numero}</span>
                <span className="text-base leading-snug">{step.titulo}</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft sm:text-sm">{step.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
