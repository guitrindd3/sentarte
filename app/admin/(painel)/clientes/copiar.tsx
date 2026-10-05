"use client";

import { avisar, btnSecondary } from "../../_ui";

/** Copies every number on the list (one per line), e.g. to build a WhatsApp broadcast list — or any `texto`. */
export function CopiarNumeros({ numeros, texto, rotulo }: { numeros: string[]; texto?: string; rotulo?: string }) {
  return (
    <button
      type="button"
      className={btnSecondary}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto ?? numeros.map((n) => `+${n}`).join("\n"));
          avisar("ok", texto ? "Mensagem copiada." : `${numeros.length} números copiados.`);
        } catch {
          avisar("erro", "Não deu para copiar neste navegador.");
        }
      }}
    >
      {rotulo ?? "Copiar todos os números"}
    </button>
  );
}
