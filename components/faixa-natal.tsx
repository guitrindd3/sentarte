"use client";

import { useEffect, useState, type ReactNode } from "react";

// Christmas strip at the very top of the public pages (2026-10-19). The pages
// are cached, so the "is the deadline over?" check runs in the browser: the
// strip disappears by itself the day after `ate` (YYYY-MM-DD, Brasília).
export function FaixaNatal({ ate, children }: { ate: string; children: ReactNode }) {
  const [passou, setPassou] = useState(false);
  useEffect(() => {
    const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPassou(hoje > ate);
  }, [ate]);
  if (passou) return null;
  return (
    <div className="relative z-50 bg-espresso px-4 py-2 text-center text-xs text-canvas sm:text-sm [&_a]:font-medium [&_a]:!text-canvas [&_a]:underline [&_a]:underline-offset-2">
      {children}
    </div>
  );
}
