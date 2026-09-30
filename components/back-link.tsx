"use client";

import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@/components/icons";

// "Voltar" at the top of every inner page (user 2026-09-30: they were
// tapping the logo to go back). Goes back in history when the visitor came
// from another page of this site; otherwise (landed straight from a link,
// e.g. Instagram) it goes to the page one level up, `fallback`.
export function BackLink({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        const veioDoSite = document.referrer.startsWith(window.location.origin);
        if (veioDoSite && window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="-ml-1 inline-flex items-center gap-1 py-2 pr-3 text-sm text-ink-soft transition-colors hover:text-ink"
    >
      <ChevronDownIcon className="h-4 w-4 rotate-90" />
      Voltar
    </button>
  );
}
