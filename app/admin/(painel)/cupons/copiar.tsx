"use client";

import { avisar, btnSecondary } from "../../_ui";

/** Copies a ready-made message (e.g. for Instagram or WhatsApp status). */
export function CopiarTexto({ texto, rotulo }: { texto: string; rotulo: string }) {
  return (
    <button
      type="button"
      title={texto}
      className={btnSecondary}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          avisar("ok", "Texto copiado. É só colar no Instagram ou no WhatsApp.");
        } catch {
          avisar("erro", "Não deu para copiar neste navegador.");
        }
      }}
    >
      {rotulo}
    </button>
  );
}
