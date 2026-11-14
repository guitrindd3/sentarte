import Link from "next/link";
import { logoutAction, logoutTodosAction } from "../../actions";
import { GRUPOS_MAIS, ICONES, Icone } from "../menu";

// Phone overflow menu (the bottom bar has room for 5 tabs). Since 2026-11-14:
// grouped tiles with the sidebar's icons and colors instead of a long list.
export default function Mais() {
  return (
    <div className="space-y-7">
      <h1 className="font-serif text-3xl font-medium tracking-tight text-ink">Mais</h1>

      {GRUPOS_MAIS.map((g) => (
        <section key={g.titulo}>
          <h2 className="mb-2.5 px-1 text-sm font-semibold text-ink-soft">{g.titulo}</h2>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {g.itens.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className="flex h-full flex-col gap-3 rounded-2xl border border-line/70 bg-paper p-3.5 shadow-[0_1px_2px_rgba(36,31,26,0.05)] transition active:scale-[0.98] active:bg-canvas"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-espresso text-rattan">
                    <Icone>{i.icone}</Icone>
                  </span>
                  <span>
                    <span className="block font-semibold leading-snug text-ink">{i.rotulo}</span>
                    <span className="mt-0.5 block text-[0.8rem] leading-snug text-ink-soft">{i.texto}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="overflow-hidden rounded-2xl bg-espresso text-paper">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3.5 active:bg-white/10">
          <span className="text-rattan">
            <Icone>{ICONES.abrir}</Icone>
          </span>
          <span className="flex-1 font-medium">Abrir o site</span>
          <span aria-hidden className="text-paper/40">›</span>
        </a>
        <form action={logoutAction} className="border-t border-white/10">
          <button type="submit" className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-white/10">
            <span className="text-rattan">
              <Icone>{ICONES.sair}</Icone>
            </span>
            <span className="flex-1 font-medium">Sair do painel</span>
          </button>
        </form>
      </section>
      <form action={logoutTodosAction} className="px-1">
        <button type="submit" className="text-sm text-ink-soft underline underline-offset-2">
          Sair de todos os aparelhos
        </button>
      </form>
    </div>
  );
}
