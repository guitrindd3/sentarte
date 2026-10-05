export function PullQuote({
  frase = "Uma cadeira boa não é a que impressiona na primeira olhada — é a que continua inteira depois do quinto verão.",
  assinatura = "Do jeito que a gente pensa cada peça no ateliê.",
}: {
  frase?: string;
  assinatura?: string;
}) {
  return (
    <section className="bg-canvas-deep px-6 py-8 md:py-10">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mx-auto block h-px w-10 bg-line" aria-hidden="true" />
        <p className="mt-6 font-serif text-2xl leading-snug text-ink italic md:text-3xl">{frase}</p>
        {assinatura ? <p className="mt-6 text-sm text-ink-soft">{assinatura}</p> : null}
      </div>
    </section>
  );
}
