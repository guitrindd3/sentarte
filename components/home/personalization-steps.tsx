const STEPS = [
  {
    numero: "1",
    titulo: "Escolha o modelo",
    texto: "Cadeira, bolsa ou espreguiçadeira, no tamanho que você precisa.",
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
    texto: "Você revê tudo pelo WhatsApp antes de fechar. Nada se perde no processo.",
  },
];

export function PersonalizationSteps() {
  return (
    <section className="bg-canvas-deep px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-serif text-2xl text-ink">Como funciona a personalização</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.numero}>
              <div
                className={`border-t-2 border-rattan pt-4 md:border-t-0 md:pt-0 ${
                  i === 0 ? "" : "md:border-l md:pl-6"
                }`}
              >
                <span className="font-serif text-3xl text-marine">{step.numero}</span>
                <p className="mt-2 font-serif text-lg text-ink">{step.titulo}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
