"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Pixels per second the row drifts sideways. */
const VELOCIDADE = 32;
/** How long it waits after the visitor touches/drags before drifting again. */
const PAUSA_MS = 3500;

// A sideways row that keeps drifting on its own and loops forever (user
// 2026-09-30, homepage team chairs on phones). The children must contain a
// second copy of the items, the first of which is marked
// `data-loop-start` — when the scroll reaches that copy it jumps back by
// exactly one set, so the loop has no visible seam. Only drifts while the
// row actually overflows (phones); on wider screens it's a plain grid.
export function AutoScrollRow({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let ultimo = performance.now();
    let pausadoAte = 0;
    let pos = el.scrollLeft; // float — scrollLeft itself rounds sub-pixel steps away

    const passo = (t: number) => {
      const dt = Math.min(0.1, (t - ultimo) / 1000);
      ultimo = t;
      const inicioCopia = el.querySelector<HTMLElement>("[data-loop-start]");
      const primeiro = el.firstElementChild as HTMLElement | null;
      const volta = inicioCopia && primeiro ? inicioCopia.offsetLeft - primeiro.offsetLeft : 0;
      const rola = el.scrollWidth > el.clientWidth + 4 && volta > 0;
      if (rola && t > pausadoAte && !document.hidden) {
        pos += VELOCIDADE * dt;
        if (pos >= volta) pos -= volta;
        el.scrollLeft = pos;
      } else {
        pos = el.scrollLeft;
        if (rola && pos >= volta) {
          pos -= volta;
          el.scrollLeft = pos;
        }
      }
      raf = requestAnimationFrame(passo);
    };

    const pausar = () => {
      pausadoAte = performance.now() + PAUSA_MS;
    };
    el.addEventListener("pointerdown", pausar);
    el.addEventListener("touchstart", pausar, { passive: true });
    el.addEventListener("touchmove", pausar, { passive: true });
    el.addEventListener("wheel", pausar, { passive: true });
    raf = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", pausar);
      el.removeEventListener("touchstart", pausar);
      el.removeEventListener("touchmove", pausar);
      el.removeEventListener("wheel", pausar);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
