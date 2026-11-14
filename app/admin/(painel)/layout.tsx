import Image from "next/image";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { estadoDaChave, githubConfigurado } from "@/lib/github-store";
import { logoutAction, logoutTodosAction } from "../actions";
import { StatusPublicacao, Toaster } from "../_ui";
import { PainelPublicacao } from "../publicar";
import { BotaoRecolher, NavInferior, NavLateral } from "./nav";

export const dynamic = "force-dynamic";

// Admin shell (2026-10-05): dark espresso sidebar on desktop, bottom tab bar
// on phones; the public site's header/footer are hidden here (ForaDoAdmin).
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  if (!(await verifySession())) redirect("/admin/login");
  // Desktop sidebar can shrink to icons only (user 2026-11-13); the choice is a cookie so the page opens the same way.
  const curto = (await cookies()).get("sentarte_menu")?.value === "curto";

  return (
    <div
      data-menu={curto ? "curto" : "largo"}
      className="admin group/admin min-h-screen bg-canvas lg:grid lg:grid-cols-[16rem_1fr] lg:data-[menu=curto]:grid-cols-[4.75rem_1fr]"
    >
      <div className="hidden bg-espresso lg:block">
      <aside className="sticky top-0 flex h-screen flex-col overflow-y-auto px-4 py-6 text-paper [scrollbar-width:none] group-data-[menu=curto]/admin:px-2.5">
        <div className="flex items-center gap-3 px-2 group-data-[menu=curto]/admin:justify-center group-data-[menu=curto]/admin:px-0">
          <Image src="/brand/logo.png" alt="" width={40} height={40} className="shrink-0 rounded-full bg-paper" />
          <div className="group-data-[menu=curto]/admin:hidden">
            <p className="font-serif text-lg font-medium leading-tight tracking-tight">SentArte</p>
            <p className="text-xs text-paper/55">Painel do ateliê</p>
          </div>
        </div>
        <BotaoRecolher />
        <div className="mt-4">
          <NavLateral />
        </div>
        <div className="mt-auto space-y-3 border-t border-paper/10 pt-4">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            title="Abrir o site"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-paper/80 transition hover:bg-paper/5 hover:text-paper group-data-[menu=curto]/admin:justify-center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4" aria-hidden>
              <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="group-data-[menu=curto]/admin:hidden">Abrir o site</span>
          </a>
          <div className="flex items-center justify-between px-3 text-xs group-data-[menu=curto]/admin:hidden">
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

      <div className="min-w-0 pb-32 lg:pb-0">
        {/* Phones: espresso band like the desktop sidebar (user 2026-11-14: "coloca as cores que tem no adm do computador"). */}
        <header className="sticky top-0 z-30 bg-espresso pt-[env(safe-area-inset-top)] text-paper shadow-[0_10px_24px_-18px_rgba(20,14,8,0.9)] lg:border-b lg:border-line/60 lg:bg-canvas/80 lg:text-ink lg:shadow-none lg:backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-8 lg:py-3">
            <a href="/admin" className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <Image src="/brand/logo.png" alt="" width={36} height={36} className="rounded-full bg-paper ring-2 ring-rattan/60" />
              <div className="min-w-0 leading-tight">
                <p className="font-serif text-lg font-medium tracking-tight">SentArte</p>
                <p className="text-xs text-paper/55">Painel do ateliê</p>
              </div>
            </a>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2">
              <StatusPublicacao />
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir o site"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-paper ring-1 ring-white/15 transition active:bg-white/20 lg:hidden"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
                  <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
          {!githubConfigurado() ? (
            <p className="mb-6 rounded-xl border border-clay/40 bg-[#fbeee8] px-4 py-3 text-sm text-clay-dark">
              Salvar está desativado: falta configurar a chave do GitHub (GITHUB_TOKEN) na Vercel.
            </p>
          ) : (
            <Suspense>
              <AvisoDaChave />
            </Suspense>
          )}
          {children}
        </div>
      </div>

      <NavInferior />
      <Toaster />
      <PainelPublicacao />
    </div>
  );
}

const diaCurto = (ms: number) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(ms));

/** Warns 15 days before the GitHub key (GITHUB_TOKEN) expires, and once it has. */
async function AvisoDaChave() {
  const c = await estadoDaChave();
  if (c.estado !== "vence" && c.estado !== "vencida") return null;
  const vencida = c.estado === "vencida";
  return (
    <div
      role="status"
      className={`mb-6 rounded-xl border px-4 py-3 text-sm ${vencida ? "border-clay/40 bg-[#fbeee8] text-clay-dark" : "border-rattan/50 bg-rattan/10 text-wood-dark"}`}
    >
      <p className="font-semibold">
        {vencida
          ? "A chave do GitHub venceu: salvar no painel não funciona até trocar."
          : `A chave do GitHub vence em ${c.dias} ${c.dias === 1 ? "dia" : "dias"} (${diaCurto(c.venceEm)}).`}
      </p>
      <p className="mt-1">
        Crie uma nova em GitHub → Settings → Developer settings → Fine-grained tokens (só o repositório sentarte, Contents: Read and write, validade de 1 ano) e cole
        na Vercel em GITHUB_TOKEN, no lugar da antiga. Depois o site precisa ser publicado de novo para a chave nova valer.
      </p>
    </div>
  );
}
