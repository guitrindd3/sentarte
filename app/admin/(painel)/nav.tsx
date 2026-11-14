"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DENTRO_DE_MAIS, GRUPOS_MAIS, Icone, MAIS, PRINCIPAIS, type ItemMenu } from "./menu";

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

function LinkLateral({ i, pathname }: { i: ItemMenu; pathname: string }) {
  const on = ativo(pathname, i.href);
  return (
    <Link
      href={i.href}
      aria-current={on ? "page" : undefined}
      title={i.rotulo}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-[0.93rem] font-medium transition group-data-[menu=curto]/admin:justify-center ${
        on ? "bg-paper/10 text-paper" : "text-paper/65 hover:bg-paper/5 hover:text-paper"
      }`}
    >
      {on ? <span aria-hidden className="absolute -left-4 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-rattan group-data-[menu=curto]/admin:-left-2.5" /> : null}
      <span className={on ? "text-rattan" : ""}>
        <Icone>{i.icone}</Icone>
      </span>
      <span className="group-data-[menu=curto]/admin:sr-only">{i.rotulo}</span>
    </Link>
  );
}

/** Desktop: sidebar in the same groups as the phone "Mais" page (2026-11-14). */
export function NavLateral() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        {PRINCIPAIS.map((i) => (
          <LinkLateral key={i.href} i={i} pathname={pathname} />
        ))}
      </div>
      {GRUPOS_MAIS.map((g) => (
        <div key={g.titulo} className="flex flex-col gap-0.5">
          <p className="mb-1 px-3 text-xs font-semibold text-rattan/80 group-data-[menu=curto]/admin:hidden">{g.titulo}</p>
          <span aria-hidden className="mx-auto mb-1 hidden h-px w-8 bg-paper/15 group-data-[menu=curto]/admin:block" />
          {g.itens.map((i) => (
            <LinkLateral key={i.href} i={i} pathname={pathname} />
          ))}
        </div>
      ))}
    </nav>
  );
}

/** Desktop header: where you are (group › page). */
export function TituloSecao() {
  const pathname = usePathname();
  const todos = [...PRINCIPAIS.map((i) => ({ i, grupo: "" })), ...GRUPOS_MAIS.flatMap((g) => g.itens.map((i) => ({ i, grupo: g.titulo })))];
  const achado = todos.filter((x) => ativo(pathname, x.i.href)).sort((a, b) => b.i.href.length - a.i.href.length)[0];
  if (!achado) return <div />;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-espresso text-rattan">
        <Icone className="h-[1.1rem] w-[1.1rem]">{achado.i.icone}</Icone>
      </span>
      <p className="truncate text-sm">
        {achado.grupo ? <span className="text-ink-soft">{achado.grupo} › </span> : null}
        <span className="font-semibold text-ink">{achado.i.rotulo}</span>
      </p>
    </div>
  );
}

/** Phone: tab bar fixed at the bottom, same espresso + rattan as the desktop sidebar. */
export function NavInferior() {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu do painel" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))] lg:hidden">
      <div className="pointer-events-auto mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[1.75rem] bg-espresso p-1.5 shadow-[0_18px_40px_-14px_rgba(20,14,8,0.75)] ring-1 ring-white/10">
        {[...PRINCIPAIS, MAIS].map((i) => {
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
