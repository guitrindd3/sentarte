"use client";

/**
 * /casamento (2026-10-23): loads an example design into the builder further
 * down the same page (ChairBuilder listens for "sentarte:trama") and scrolls
 * to it. Without JS the link still opens /personalizar on that design.
 */
export function ComecarComEste({ trama }: { trama: string }) {
  return (
    <a
      href={`/personalizar?${trama}`}
      onClick={(e) => {
        const alvo = document.getElementById("monte");
        if (!alvo) return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("sentarte:trama", { detail: trama }));
        alvo.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="mt-4 inline-flex rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-canvas"
    >
      Começar com este
    </a>
  );
}
