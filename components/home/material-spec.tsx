import { FramedWeave } from "@/components/framed-weave";

const SPECS = [
  {
    rotulo: "Trama",
    valor:
      "Corda náutica 100% polipropileno — não absorve água, então não apodrece nem mofa mesmo com contato constante com a maresia.",
  },
  {
    rotulo: "Estrutura",
    valor: "Alumínio, que não enferruja e mantém a peça leve, dobrável e fácil de transportar.",
  },
  {
    rotulo: "Trançado",
    valor: "Feito à mão, fio a fio, com acabamento firme — sem colas, sem grampos.",
  },
  {
    rotulo: "Resistência",
    valor: "Pensada para sol, areia e maresia, temporada após temporada.",
  },
];

export function MaterialSpec() {
  return (
    <section className="bg-espresso px-6 py-24 text-canvas">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight">Por dentro do trançado</h2>
          <dl className="mt-8 space-y-6">
            {SPECS.map((spec) => (
              <div key={spec.rotulo} className="border-l-2 border-dashed border-rattan pl-4">
                <dt className="font-serif text-base font-medium text-rattan">{spec.rotulo}</dt>
                <dd className="mt-1 max-w-[52ch] text-sm leading-relaxed text-canvas/90">
                  {spec.valor}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="order-first md:order-none">
          <FramedWeave
            imagemUrl="/photos/rope-texture.jpg"
            alt="Corda náutica trançada à mão, de perto"
            tone="canvas"
          />
        </div>
      </div>
    </section>
  );
}
