"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { rastrear } from "@/lib/rastro";

/** Readable label for what was clicked: data-rastro wins, then known links, then the text. */
function rotulo(el: HTMLElement): string | null {
  const marcado = el.closest<HTMLElement>("[data-rastro]");
  if (marcado) return marcado.dataset.rastro ?? null;
  const alvo = el.closest<HTMLElement>("a, button");
  if (!alvo || alvo.closest("[data-sem-rastro]")) return null;
  const href = alvo instanceof HTMLAnchorElement ? alvo.href : "";
  if (/wa\.me|whatsapp/i.test(href)) return "WhatsApp";
  if (/instagram\.com/i.test(href)) return "Instagram";
  const texto = (alvo.getAttribute("aria-label") || alvo.textContent || "").replace(/\s+/g, " ").trim();
  if (!texto || texto.length > 50) return null;
  return texto;
}

/** Counts page views and clicks (anonymous). Mounted once in the root layout. */
export function Rastreador() {
  const pathname = usePathname();
  const primeira = useRef(true);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const q = pathname === "/busca" ? new URLSearchParams(location.search).get("q") ?? undefined : undefined;
    rastrear({ t: "v", p: pathname, r: primeira.current ? document.referrer || undefined : location.origin, q });
    primeira.current = false;
  }, [pathname]);

  useEffect(() => {
    const aoClicar = (e: MouseEvent) => {
      const l = e.target instanceof HTMLElement ? rotulo(e.target) : null;
      if (l) rastrear({ t: "c", l });
    };
    document.addEventListener("click", aoClicar, { capture: true });
    return () => document.removeEventListener("click", aoClicar, { capture: true });
  }, []);

  return null;
}
