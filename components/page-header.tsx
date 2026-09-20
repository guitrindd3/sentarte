export function PageHeader({ titulo, resumo }: { titulo: string; resumo?: string }) {
  return (
    <section className="border-b border-line bg-canvas-deep px-6 py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-3xl text-ink md:text-4xl">{titulo}</h1>
        {resumo ? (
          <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-ink-soft">{resumo}</p>
        ) : null}
      </div>
    </section>
  );
}
