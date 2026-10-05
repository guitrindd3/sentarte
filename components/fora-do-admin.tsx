"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Hides the public site's chrome (header, footer) inside /admin, which has its own shell. */
export function ForaDoAdmin({ children }: { children: ReactNode }) {
  return usePathname().startsWith("/admin") ? null : children;
}
