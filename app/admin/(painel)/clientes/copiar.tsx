"use client";

import { avisar, btnSecondary } from "../../_ui";

/** Copies every number on the list (one per line), e.g. to build a WhatsApp broadcast list. */
export function CopiarNumeros({ numeros }: { numeros: string[] }) {
  return (
    <button
      type="button"
      className={btnSecondary}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(numeros.map((n) => `+${n}`).join("\n"));
          avisar("ok", `${numeros.length} números copiados.`);
        } catch {
          avisar("erro", "Não deu para copiar neste navegador.");
        }
      }}
    >
      Copiar todos os números
    </button>
  );
}
