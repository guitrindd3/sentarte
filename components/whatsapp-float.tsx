"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappUrl } from "@/lib/urls";

// Always-visible contact button (bottom-right). Kept in the site's
// monochrome ink/canvas palette rather than WhatsApp green, per the design
// notes in CLAUDE.md.
export function WhatsAppFloat({ whatsappNumero }: { whatsappNumero: string }) {
  const pathname = usePathname();
  // Hidden while the footer is on screen (user 2026-10-06: it covered the footer
  // links) — the footer has its own WhatsApp link.
  const [noRodape, setNoRodape] = useState(false);
  useEffect(() => {
    const rodape = document.getElementById("rodape");
    if (!rodape) return;
    const obs = new IntersectionObserver(([e]) => setNoRodape(e.isIntersecting), { threshold: 0.05 });
    obs.observe(rodape);
    return () => obs.disconnect();
  }, [pathname]);
  if (pathname === "/personalizar" || pathname.startsWith("/admin")) return null;
  return (
    <a
      href={whatsappUrl(whatsappNumero, "Oi! Vim pelo site e queria saber mais sobre as cadeiras.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      aria-hidden={noRodape || undefined}
      tabIndex={noRodape ? -1 : undefined}
      className={`${noRodape ? "pointer-events-none translate-y-4 opacity-0" : "opacity-100"} transition-all duration-300 fixed bottom-[calc(0.9rem+env(safe-area-inset-bottom,0px))] right-3 z-40 inline-flex items-center gap-2 rounded-full border border-ink bg-ink p-3 text-canvas md:bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] md:right-5 shadow-[4px_4px_0_0_var(--line)] hover:bg-canvas hover:text-ink md:px-5 md:py-3`}
    >
      <WhatsAppIcon className="h-5 w-5" />
      <span className="hidden text-sm font-medium md:inline">Fale com a gente</span>
    </a>
  );
}
