/** Read-only star row (reviews). `valor` may be fractional (averages). */
export function Estrelas({ valor, tamanho = "h-4 w-4", rotulo }: { valor: number; tamanho?: string; rotulo?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={rotulo ?? `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const cheia = Math.max(0, Math.min(1, valor - (i - 1)));
        return (
          <span key={i} className={`relative inline-block ${tamanho}`} aria-hidden>
            <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full text-line" fill="currentColor">
              <path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.5 1.1 6.3L12 17.3l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" />
            </svg>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${cheia * 100}%` }}>
              <svg viewBox="0 0 24 24" className={`h-full ${tamanho.split(" ").find((c) => c.startsWith("w-")) ?? "w-4"} text-rattan`} fill="currentColor">
                <path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.5 1.1 6.3L12 17.3l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}
