"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACESSOS, CADEIRAS, CLIENTES, DENTRO_DE_MAIS, INICIO, ITENS_LATERAL, Icone, MAIS } from "./menu";

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

function ativo(pathname: string, href: string) {
  if (href === "/admin/mais") return DENTRO_DE_MAIS.some((h) => pathname.startsWith(h));
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** Desktop: vertical list in the sidebar. */
export function NavLateral() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ITENS_LATERAL.map((i) => {
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

/** Phone: tab bar fixed at the bottom, same espresso + rattan as the desktop sidebar. */
export function NavInferior() {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu do painel" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))] lg:hidden">
      <div className="pointer-events-auto mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[1.75rem] bg-espresso p-1.5 shadow-[0_18px_40px_-14px_rgba(20,14,8,0.75)] ring-1 ring-white/10">
        {[INICIO, CLIENTES, CADEIRAS, ACESSOS, MAIS].map((i) => {
          const on = ativo(pathname, i.href);
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={on ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 rounded-[1.35rem] pb-2 pt-2.5 text-[0.75rem] font-medium transition-colors ${
                on ? "bg-paper/10 text-paper" : "text-paper/60 active:bg-white/10"
              }`}
            >
              <span className={on ? "text-rattan" : ""}>
                <Icone className="h-[1.4rem] w-[1.4rem]">{i.icone}</Icone>
              </span>
              {i.rotulo}
              {on ? <span aria-hidden className="absolute top-1 h-1 w-1 rounded-full bg-rattan" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
