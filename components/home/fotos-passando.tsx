"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Chair photos that take turns behind the "Ver todas as cadeiras" tile
// (user 2026-11-23: "animações de imagens das cadeiras mudando e aparecendo").
// Each photo fades in with a slow zoom; only the previous, current and next ones
// are mounted, so the tile stays light. Stops on "reduzir movimento" (first photo only).
const TEMPO_MS = 2600;

export function FotosPassando({ fotos }: { fotos: { src: string; alt: string }[] }) {
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    if (fotos.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Start only when the tile is on screen, pause while the tab is hidden.
    let vez: ReturnType<typeof setInterval> | undefined;
    const el = document.getElementById("fotos-passando");
    const obs = new IntersectionObserver(([e]) => {
      clearInterval(vez);
      if (e.isIntersecting) vez = setInterval(() => !document.hidden && setAtual((i) => (i + 1) % fotos.length), TEMPO_MS);
    });
    if (el) obs.observe(el);
    return () => {
      obs.disconnect();
      clearInterval(vez);
    };
  }, [fotos.length]);

  if (!fotos.length) return null;
  const proxima = (atual + 1) % fotos.length;
  // previous stays mounted while it fades out; next is mounted (invisible) so it's loaded in time
  const anterior = (atual - 1 + fotos.length) % fotos.length;

  return (
    <span id="fotos-passando" aria-hidden className="absolute inset-0 overflow-hidden">
      {fotos.map((f, i) =>
        i === atual || i === proxima || i === anterior ? (
          <span
            key={f.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${i === atual ? "opacity-100" : "opacity-0"}`}
          >
            <Image
              src={f.src}
              alt=""
              fill
              sizes="(min-width: 768px) 270px, 100vw"
              className={`object-cover ${i === atual ? "fotos-passando-zoom" : ""}`}
            />
          </span>
        ) : null
      )}
      {/* darkening so the white text always reads */}
      <span className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/40 to-ink/90" />
    </span>
  );
}
