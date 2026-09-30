import { BackLink } from "@/components/back-link";

export function PageHeader({
  titulo,
  resumo,
  voltarPara = "/",
}: {
  titulo: string;
  resumo?: string;
  /** Where "Voltar" goes when there's no previous page on this site. */
  voltarPara?: string;
}) {
  return (
    <section className="border-b border-line bg-canvas-deep pb-10 pt-4 md:pb-14 md:pt-6">
      <div className="mx-auto max-w-6xl px-6">
        <BackLink fallback={voltarPara} />
        <div className="mt-2" />
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">{titulo}</h1>
        {resumo ? (
          <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-ink-soft">{resumo}</p>
        ) : null}
      </div>
    </section>
  );
}
