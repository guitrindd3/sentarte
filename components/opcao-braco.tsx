import { BRACO_MADEIRA, formatBRL, FOTO_BRACO_MADEIRA, type TipoCadeira } from "@/lib/offer";

/**
 * "Braço padrão / Braço de madeira" (user 2026-10-21: an option on every
 * chair). The thumbnail is a close-up of the Diamante verde chair's wooden
 * armrest. Used by the product page, the catalog card and Monte a sua trama.
 */
export function OpcaoBraco({
  madeira,
  onChange,
  tipo = "normal",
  compacto = false,
}: {
  madeira: boolean;
  onChange: (madeira: boolean) => void;
  tipo?: TipoCadeira;
  /** catalog card: one small checkbox line */
  compacto?: boolean;
}) {
  const extra = formatBRL(BRACO_MADEIRA[tipo]);
  const amostra = (
    <span
      aria-hidden
      className="block h-9 w-9 shrink-0 border border-line bg-canvas"
      style={{ backgroundImage: `url(${FOTO_BRACO_MADEIRA})`, backgroundSize: "1100%", backgroundPosition: "36.5% 46%" }}
    />
  );
  if (compacto) {
    return (
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-ink">
        <input type="checkbox" checked={madeira} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--ink)]" />
        Braço de madeira <span className="text-ink-soft">(+{extra})</span>
      </label>
    );
  }
  return (
    <fieldset>
      <legend className="text-sm text-ink-soft">Braço da cadeira</legend>
      <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Braço da cadeira">
        {[false, true].map((m) => {
          const on = madeira === m;
          return (
            <button
              key={String(m)}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(m)}
              className={`flex items-center gap-2.5 border px-3 py-2 text-left text-sm transition-colors ${
                on ? "border-ink bg-ink text-canvas" : "border-line text-ink hover:border-ink"
              }`}
            >
              {m ? amostra : null}
              <span>
                <span className="block font-medium">{m ? "De madeira" : "Padrão"}</span>
                <span className={`block text-xs ${on ? "text-canvas/75" : "text-ink-soft"}`}>{m ? `+${extra}` : "Incluso"}</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
