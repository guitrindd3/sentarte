"use client";

import { useState } from "react";

/** "Mostrar para alguém": the phone's share sheet, else WhatsApp / copy the link. */
export function CompartilharPassaporte({ url, titulo }: { url: string; titulo: string }) {
  const [copiado, setCopiado] = useState(false);
  const texto = `Olha a história da minha cadeira, trançada à mão no Ateliê SentArte: ${titulo}`;
  const compartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {}
  };
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={compartilhar}
        data-rastro="Passaporte: compartilhar"
        className="inline-flex items-center justify-center border border-ink px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-canvas"
      >
        {copiado ? "Link copiado ✓" : "Mostrar para alguém"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${texto}\n${url}`)}`}
        target="_blank"
        rel="noreferrer"
        data-rastro="Passaporte: WhatsApp"
        className="inline-flex items-center justify-center px-3 py-2.5 text-sm text-ink-soft underline underline-offset-2 hover:text-ink"
      >
        Mandar no WhatsApp
      </a>
    </div>
  );
}
