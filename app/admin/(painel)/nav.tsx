"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const ITENS: { href: string; rotulo: string; icone: ReactNode }[] = [
  {
    href: "/admin",
    rotulo: "Início",
    icone: <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />,
  },
  {
    href: "/admin/acessos",
    rotulo: "Acessos",
    icone: <path d="M4 20h16M7 16v-4M11 16V8M15 16v-6M19 16V5" />,
  },
  {
    href: "/admin/clientes",
    rotulo: "Clientes",
    icone: (
      <>
        <circle cx="9" cy="8.5" r="3" />
        <path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8M15.5 6a3 3 0 0 1 0 5.6M17 14.6c1.8.6 3 2.1 3.5 4.4" />
      </>
    ),
  },
  {
    href: "/admin/cupons",
    rotulo: "Cupons",
    icone: <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4zM9.5 14.5l5-5M9.75 9.75h.01M14.25 14.25h.01" />,
  },
  {
    href: "/admin/catalogo",
    rotulo: "Cadeiras",
    icone: (
      <>
        <path d="M7 4h10l-1 8H8z" />
        <path d="M6 12h12M8 12l-2 8M16 12l2 8M9.5 4v8M12 4v8M14.5 4v8" />
      </>
    ),
  },
  {
    href: "/admin/depoimentos",
    rotulo: "Depoimentos",
    icone: <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 9.5h8M8 12.5h5" />,
  },
  {
    href: "/admin/site",
    rotulo: "Textos e contato",
    icone: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6" />
      </>
    ),
  },
  {
    href: "/admin/seguranca",
    rotulo: "Segurança",
    icone: <path d="M12 3.5 5 6v5.5c0 4.3 3 7.7 7 9 4-1.3 7-4.7 7-9V6zM9 12l2 2 4-4" />,
  },
];

const MAIS = {
  href: "/admin/mais",
  rotulo: "Mais",
  icone: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" />,
};
const DENTRO_DE_MAIS = ["/admin/mais", "/admin/cupons", "/admin/depoimentos", "/admin/site", "/admin/seguranca"];

function ativo(pathname: string, href: string) {
  if (href === "/admin/mais") return DENTRO_DE_MAIS.some((h) => pathname.startsWith(h));
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function Icone({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden>
      {children}
    </svg>
  );
}

/** Desktop: vertical list in the sidebar. */
export function NavLateral() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ITENS.map((i) => {
        const on = ativo(pathname, i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={on ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition ${
              on ? "bg-paper/10 text-paper" : "text-paper/65 hover:bg-paper/5 hover:text-paper"
            }`}
          >
            <span className={on ? "text-rattan" : ""}>
              <Icone>{i.icone}</Icone>
            </span>
            {i.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

/** Phone: tab bar fixed at the bottom. */
export function NavInferior() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {[...ITENS.filter((i) => ["/admin", "/admin/acessos", "/admin/clientes", "/admin/catalogo"].includes(i.href)), MAIS].map((i) => {
          const on = ativo(pathname, i.href);
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={on ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium ${on ? "text-wood-dark" : "text-ink-soft"}`}
            >
              <Icone>{i.icone}</Icone>
              {i.rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
