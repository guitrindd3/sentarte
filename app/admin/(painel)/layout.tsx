import Image from "next/image";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { githubConfigurado } from "@/lib/github-store";
import { logoutAction, logoutTodosAction } from "../actions";
import { StatusPublicacao, Toaster } from "../_ui";
import { NavInferior, NavLateral } from "./nav";

export const dynamic = "force-dynamic";

// Admin shell (2026-10-05): dark espresso sidebar on desktop, bottom tab bar
// on phones; the public site's header/footer are hidden here (ForaDoAdmin).
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  if (!(await verifySession())) redirect("/admin/login");

  return (
    <div className="admin min-h-screen bg-canvas lg:grid lg:grid-cols-[16rem_1fr]">
      <div className="hidden bg-espresso lg:block">
      <aside className="sticky top-0 flex h-screen flex-col px-4 py-6 text-paper">
        <div className="flex items-center gap-3 px-2">
          <Image src="/brand/logo.png" alt="" width={40} height={40} className="rounded-full bg-paper" />
          <div>
            <p className="font-serif text-lg font-medium leading-tight tracking-tight">SentArte</p>
            <p className="text-xs text-paper/55">Painel do ateliê</p>
          </div>
        </div>
        <div className="mt-8">
          <NavLateral />
        </div>
        <div className="mt-auto space-y-3 border-t border-paper/10 pt-4">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-paper/80 transition hover:bg-paper/5 hover:text-paper"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4" aria-hidden>
              <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Abrir o site
          </a>
          <div className="flex items-center justify-between px-3 text-xs">
            <form action={logoutAction}>
              <button type="submit" className="text-paper/60 underline-offset-2 hover:text-paper hover:underline">
                Sair
              </button>
            </form>
            <form action={logoutTodosAction}>
              <button type="submit" className="text-paper/40 underline-offset-2 hover:text-paper hover:underline">
                Sair de todos os aparelhos
              </button>
            </form>
          </div>
        </div>
      </aside>
      </div>

      <div className="min-w-0 pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
            <div className="flex items-center gap-2.5 lg:hidden">
              <Image src="/brand/logo.png" alt="" width={32} height={32} className="rounded-full" />
              <p className="font-serif text-base font-medium tracking-tight text-ink">Painel SentArte</p>
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-3">
              <StatusPublicacao />
              <a href="/" target="_blank" rel="noreferrer" className="text-sm font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline lg:hidden">
                Ver site
              </a>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
          {!githubConfigurado() ? (
            <p className="mb-6 rounded-xl border border-clay/40 bg-[#fbeee8] px-4 py-3 text-sm text-clay-dark">
              Salvar está desativado: falta configurar a chave do GitHub (GITHUB_TOKEN) na Vercel.
            </p>
          ) : null}
          {children}
        </div>
      </div>

      <NavInferior />
      <Toaster />
    </div>
  );
}
