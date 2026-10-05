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
    <section className="bg-canvas-deep px-6 pb-8 pt-12 md:pb-10 md:pt-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">{titulo}</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-4">
          {lista.map((step, i) => (
            <li key={step.numero}>
              <div
                className={`border-t-2 border-line pt-4 md:border-t-0 md:pt-0 ${
                  i === 0 ? "" : "md:border-l md:pl-6"
                }`}
              >
                <span className="font-serif text-3xl font-medium text-ink">{step.numero}</span>
                <p className="mt-2 font-serif text-lg font-medium tracking-tight text-ink">{step.titulo}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
