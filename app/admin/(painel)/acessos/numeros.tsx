"use client";

import { useEffect, useState } from "react";

// Acessos screens hide their numbers behind a blur (2026-10-08, user: "muita
// coisa na tela... só se eu clicar eu vejo os números, ou se passar o mouse").
// Any `.num-oculto` element un-blurs on hover of itself or its `.num-alvo` box
// (CSS in globals.css), on tap (this listener toggles `.aberto` on the box,
// except inside links/buttons, which keep their own action), or
// everywhere at once with this button (`data-numeros="sim"` on <html>,
// remembered in this browser).

const CHAVE = "sentarte-admin-numeros";

export function MostrarNumeros() {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    let salvo = false;
    try {
      salvo = localStorage.getItem(CHAVE) === "sim";
    } catch {}
    document.documentElement.dataset.numeros = salvo ? "sim" : "nao";
    const t = setTimeout(() => setMostrar(salvo), 0);

    const tocar = (e: MouseEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("a, button")) return;
      const el = alvo.closest(".num-alvo") ?? alvo.closest(".num-oculto");
      el?.classList.toggle("aberto");
    };
    document.addEventListener("click", tocar);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", tocar);
    };
  }, []);

  const trocar = () => {
    const novo = !mostrar;
    setMostrar(novo);
    document.documentElement.dataset.numeros = novo ? "sim" : "nao";
    try {
      localStorage.setItem(CHAVE, novo ? "sim" : "nao");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={trocar}
      aria-pressed={mostrar}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm font-medium text-ink-soft transition hover:border-wood hover:text-ink"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        {mostrar ? (
          <>
            <path d="M3 3l18 18" />
            <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6A17.3 17.3 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </>
        ) : (
          <>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
      {mostrar ? "Esconder números" : "Mostrar números"}
    </button>
  );
}
