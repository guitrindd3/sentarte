import { saldoMelhorEnvio } from "@/lib/melhor-envio";
import { formatBRL } from "@/lib/offer";
import { ICONES, Icone } from "./menu";

// Admin home (2026-11-14): Melhor Envio wallet balance, read-only. Rendered
// inside <Suspense> so the page never waits on it; hidden when there's no token
// or Melhor Envio doesn't answer within 3 s.

/** Roughly one chair label (folded chair, plastic bag) — below this, warn when there are orders to ship. */
const UMA_ETIQUETA = 40;
const CARTEIRA = "https://app.melhorenvio.com.br/carteira";

export async function SaldoEnvio({ paraEnviar }: { paraEnviar: number }) {
  const saldo = await saldoMelhorEnvio();
  if (saldo === null) return null;
  const baixo = paraEnviar > 0 && saldo < UMA_ETIQUETA;

  if (baixo) {
    return (
      <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-clay/50 bg-clay/10 px-5 py-4">
        <span>
          <span className="block font-semibold text-clay-dark">Saldo no Melhor Envio: {formatBRL(saldo)}</span>
          <span className="block text-sm text-ink">
            Você tem {paraEnviar} {paraEnviar === 1 ? "pedido para enviar" : "pedidos para enviar"} e uma etiqueta costuma custar uns R$ 30 a R$ 40. Coloque saldo antes de
            gerar a etiqueta.
          </span>
        </span>
        <a href={CARTEIRA} target="_blank" rel="noreferrer" className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-paper hover:bg-clay-dark">
          Colocar saldo
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line/70 bg-paper px-4 py-3 shadow-[0_1px_2px_rgba(36,31,26,0.05)]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-espresso text-rattan">
        <Icone className="h-5 w-5">{ICONES.envio}</Icone>
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-xs text-ink-soft">Saldo no Melhor Envio</span>
        <span className="block text-lg font-semibold text-ink">{formatBRL(saldo)}</span>
      </span>
      <a href={CARTEIRA} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-ink hover:border-wood">
        Colocar saldo
      </a>
    </div>
  );
}
