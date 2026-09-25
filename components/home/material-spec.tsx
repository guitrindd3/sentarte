import { FramedWeave } from "@/components/framed-weave";
import { WaveIcon, FrameIcon, HandIcon } from "@/components/icons";

const FEATURES = [
  {
    titulo: "Resistente à maresia",
    valor: "O polipropileno não absorve água, então não apodrece nem mofa.",
    Icon: WaveIcon,
  },
  {
    titulo: "Estrutura em alumínio",
    valor: "Não enferruja e mantém a cadeira leve.",
    Icon: FrameIcon,
  },
  {
    titulo: "Trançado à mão",
    valor: "Cada peça é feita fio a fio, com acabamento firme.",
    Icon: HandIcon,
  },
];

export function MaterialSpec() {
  return (
    <section className="bg-canvas-deep px-6 py-24 text-ink">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight">A linha que sustenta cada peça</h2>
          <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-ink-soft">
            Trabalhamos com corda náutica 100% polipropileno — um material que não absorve
            água, por isso não apodrece nem mofa mesmo com contato constante com a maresia. A
            estrutura é em alumínio, que não enferruja e mantém a cadeira leve e fácil de dobrar
            e transportar.
          </p>
          <dl className="mt-8 space-y-5">
            {FEATURES.map(({ titulo, valor, Icon }) => (
              <div key={titulo} className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-clay" />
                <div>
                  <dt className="font-serif text-base font-medium text-ink">{titulo}</dt>
                  <dd className="mt-1 max-w-[48ch] text-sm leading-relaxed text-ink-soft">{valor}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
        <div className="order-first md:order-none">
          <FramedWeave
            imagemUrl="/photos/thread-spools.jpg"
            alt="Novelos de corda náutica em várias cores, sobre a areia"
            tone="paper"
          />
        </div>
      </div>
    </section>
  );
}
