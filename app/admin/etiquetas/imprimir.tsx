"use client";

export function Imprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-canvas hover:bg-ink/85">
      Imprimir
    </button>
  );
}
