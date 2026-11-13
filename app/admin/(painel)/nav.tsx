"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Same name the layout reads (a constant exported from this client file would reach the server as a reference, not a string). */
const COOKIE_MENU = "sentarte_menu";

/**
 * Shrinks the desktop sidebar to icons only, or opens it again (user
 * 2026-11-13). Flips data-menu on the .admin wrapper (the CSS follows it) and
 * remembers it in a cookie for a year.
 */
export function BotaoRecolher() {
  const alternar = (e: React.MouseEvent<HTMLButtonElement>) => {
    const raiz = e.currentTarget.closest<HTMLElement>(".admin");
    if (!raiz) return;
    const novo = raiz.dataset.menu !== "curto";
    raiz.dataset.menu = novo ? "curto" : "largo";
    document.cookie = `${COOKIE_MENU}=${novo ? "curto" : "largo"}; path=/admin; max-age=31536000; samesite=lax`;
  };
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Recolher ou mostrar o menu"
      title="Recolher / mostrar o menu"
      className="mt-6 flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-paper/50 transition hover:bg-paper/5 hover:text-paper group-data-[menu=curto]/admin:justify-center"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 transition-transform group-data-[menu=curto]/admin:rotate-180" aria-hidden>
        <path d="M4 5.5v13M15 7l-5 5 5 5M10 12h10" />
      </svg>
      <span className="group-data-[menu=curto]/admin:hidden">Recolher menu</span>
    </button>
  );
}

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
    href: "/admin/orcamentos",
    rotulo: "Orçamentos",
    icone: <path d="M7 3.5h10a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1zM9 8h6M9 11.5h6M9 15h3.5" />,
  },
  {
    href: "/admin/avisos",
    rotulo: "Avisos e envio",
    icone: <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />,
  },
  {
    href: "/admin/vagas",
    rotulo: "Vagas da semana",
    icone: <path d="M5 6.5h14v13H5zM5 10.5h14M9 4v4M15 4v4M8.5 14l2 2 4-4" />,
  },
  {
    href: "/admin/cupons",
    rotulo: "Cupons",
    icone: <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4zM9.5 14.5l5-5M9.75 9.75h.01M14.25 14.25h.01" />,
  },
  {
    href: "/admin/campanhas",
    rotulo: "Campanhas",
    icone: <path d="M4 6.5h16v11H4zM4 7l8 6 8-6" />,
  },
  {
    href: "/admin/colecoes",
    rotulo: "Coleções",
    icone: <path d="M5 4.5h14v15H5zM9 4.5v15M12.5 9h3.5M12.5 12.5h3.5M12.5 16h2" />,
  },
  {
    href: "/admin/passaportes",
    rotulo: "Passaportes",
    icone: <path d="M6 3.5h12a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1zM8.5 8h2.5v2.5H8.5zM13 8h2.5v2.5H13zM8.5 12.5h2.5V15H8.5zM13.5 13h2M13.5 16h2M8.5 17.5h3" />,
  },
  {
    href: "/admin/cartoes",
    rotulo: "Cartões",
    icone: <path d="M4 6.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zM8.5 12a1.5 1.5 0 1 0 0-.01M12 10.5h5M12 13.5h3.5" />,
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
    href: "/admin/montar",
    rotulo: "Montar e publicar",
    icone: <path d="M5 19.5 15.5 9M14 5.5l4.5 4.5M12.5 4 20 11.5M4.5 14.5l5 5" />,
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
    href: "/admin/paginas",
    rotulo: "Páginas",
    icone: <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20zM14 3.5V8h4M10 12h5M10 15.5h5" />,
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
const DENTRO_DE_MAIS = ["/admin/mais", "/admin/orcamentos", "/admin/avisos", "/admin/vagas", "/admin/montar", "/admin/cupons", "/admin/campanhas", "/admin/colecoes", "/admin/passaportes", "/admin/cartoes", "/admin/paginas", "/admin/depoimentos", "/admin/site", "/admin/seguranca"];

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
            title={i.rotulo}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition group-data-[menu=curto]/admin:justify-center ${
              on ? "bg-paper/10 text-paper" : "text-paper/65 hover:bg-paper/5 hover:text-paper"
            }`}
          >
            <span className={on ? "text-rattan" : ""}>
              <Icone>{i.icone}</Icone>
            </span>
            <span className="group-data-[menu=curto]/admin:sr-only">{i.rotulo}</span>
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
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))] lg:hidden">
      <div className="pointer-events-auto mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[1.75rem] bg-espresso/95 p-1.5 shadow-[0_18px_40px_-14px_rgba(20,14,8,0.7)] ring-1 ring-white/10 backdrop-blur-md">
        {[...ITENS.filter((i) => ["/admin", "/admin/acessos", "/admin/clientes", "/admin/catalogo"].includes(i.href)), MAIS].map((i) => {
          const on = ativo(pathname, i.href);
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={on ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 rounded-[1.35rem] py-2 text-xs font-medium transition-colors ${
                on ? "bg-paper text-espresso shadow-sm" : "text-paper/65 active:bg-white/10"
              }`}
            >
              <span className={on ? "text-wood" : ""}>
                <Icone>{i.icone}</Icone>
              </span>
              {i.rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
