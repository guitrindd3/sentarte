"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";

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
export function AutoScrollRow({
  className,
  children,
  copiaNoNavegador = false,
}: {
  className: string;
  children: ReactNode;
  /** Make the loop's second copy here, once the page is up, instead of
   * shipping it in the HTML — the children are then just the one set. */
  copiaNoNavegador?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [comCopia, setComCopia] = useState(false);

  useEffect(() => {
    if (!copiaNoNavegador) return;
    const cedo = typeof window.requestIdleCallback === "function";
    const id = cedo ? window.requestIdleCallback(() => setComCopia(true), { timeout: 2500 }) : window.setTimeout(() => setComCopia(true), 1200);
    return () => (cedo ? window.cancelIdleCallback(id) : window.clearTimeout(id));
  }, [copiaNoNavegador]);

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
    // No pause on mouse hover (user 2026-10-05: "quero que ele continue") — only
    // while someone drags, swipes or scrolls the row by hand.
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
      {comCopia
        ? Children.toArray(children)
            .filter(isValidElement)
            .map((el, i) =>
              cloneElement(el as ReactElement<Record<string, unknown>>, {
                key: `copia-${el.key ?? i}`,
                inert: true,
                "aria-hidden": "true",
                "data-loop-start": i === 0 ? "" : undefined,
              })
            )
        : null}
    </div>
  );
}
