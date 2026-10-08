import Link from "next/link";
import type { ReactNode } from "react";
import type { Contagem } from "@/lib/estatisticas";

export const fmt = (n: number) => n.toLocaleString("pt-BR");
export const diaCurto = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/** Ranked list with bars; each line opens its detail page when `href` is given. */
export function Ranking({
  itens,
  vazio,
  max = 8,
  nome = (s: string) => s,
  href,
}: {
  itens: Contagem;
  vazio: string;
  max?: number;
  nome?: (s: string) => string;
  href?: (valor: string) => string;
}) {
  if (itens.length === 0) return <p className="py-4 text-sm text-ink-soft">{vazio}</p>;
  const topo = itens[0].n;
  const total = itens.reduce((a, b) => a + b.n, 0);
  return (
    <ol className="space-y-1">
      {itens.slice(0, max).map((x) => {
        const conteudo = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-ink">{nome(x.nome)}</span>
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="num-oculto flex items-baseline gap-2">
                  <span className="text-xs text-ink-soft">{Math.round((x.n / total) * 100)}%</span>
                  <span className="font-semibold tabular-nums text-ink">{fmt(x.n)}</span>
                </span>
                {href ? <span aria-hidden className="text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-ink">›</span> : null}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-canvas-deep">
              <div className="h-2 rounded-full bg-wood transition-colors group-hover:bg-wood-dark" style={{ width: `${Math.max(3, (x.n / topo) * 100)}%` }} />
            </div>
          </>
        );
        return (
          <li key={x.nome}>
            {href ? (
              <Link href={href(x.nome)} className="num-alvo group -mx-2 block rounded-lg px-2 py-1.5 transition hover:bg-canvas" title={`Ver detalhes de ${nome(x.nome)}`}>
                {conteudo}
              </Link>
            ) : (
              <div className="num-alvo group py-1.5">{conteudo}</div>
            )}
          </li>
        );
      })}
      {itens.length > max ? <li className="pt-1 text-xs text-ink-soft">e mais {itens.length - max}</li> : null}
    </ol>
  );
}

/** One bar per day; bars become links when `href` is given. */
export function GraficoDias({
  dias,
  rotulo,
  href,
}: {
  dias: { dia: string; n: number; extra?: string }[];
  rotulo: string;
  href?: (dia: string) => string;
}) {
  const topo = Math.max(1, ...dias.map((d) => d.n));
  const marcar = dias.length <= 10 ? 1 : dias.length <= 31 ? 5 : 15;
  return (
    <div>
      <div className="flex h-44 items-end gap-[2px]" role="img" aria-label={rotulo}>
        {dias.map((d) => {
          const barra = (
            <>
              <div
                className="w-full rounded-t-[4px] bg-wood transition-colors group-hover:bg-wood-dark"
                style={{ height: d.n ? `${Math.max(3, (d.n / topo) * 100)}%` : "2px", opacity: d.n ? 1 : 0.25 }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-espresso px-2.5 py-1.5 text-xs text-paper shadow-lg group-hover:block">
                <span className="font-semibold">{diaCurto(d.dia)}</span>: {d.extra ?? `${fmt(d.n)} ${rotulo.toLowerCase()}`}
                {href && d.n ? <span className="block text-paper/70">Clique para ver o dia</span> : null}
              </div>
            </>
          );
          return href && d.n ? (
            <Link key={d.dia} href={href(d.dia)} className="group relative flex h-full flex-1 items-end">
              {barra}
            </Link>
          ) : (
            <div key={d.dia} className="group relative flex h-full flex-1 items-end">
              {barra}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[2px] border-t border-line pt-1.5 text-[0.7rem] text-ink-soft">
        {dias.map((d, i) => (
          <span key={d.dia} className="flex-1 text-center">
            {i % marcar === 0 || i === dias.length - 1 ? diaCurto(d.dia) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Small number tile; a link when `href` is given. */
export function Numero({ n, rotulo, dica, href }: { n: number | string; rotulo: string; dica?: string; href?: string }) {
  const corpo = (
    <>
      <p className="mt-1 text-sm font-medium text-ink">{rotulo}</p>
      <p className="mt-1 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        <span className="num-oculto inline-block">{typeof n === "number" ? fmt(n) : n}</span>
      </p>
      {dica ? <p className={`text-xs text-ink-soft ${/\d/.test(dica) ? "num-oculto" : ""}`}>{dica}</p> : null}
      {href ? <p className="mt-2 text-xs font-semibold text-wood-dark group-hover:underline">Ver detalhes ›</p> : null}
    </>
  );
  const cls = "num-alvo rounded-2xl border border-line/70 bg-paper p-4 sm:p-5";
  return href ? (
    <Link href={href} className={`${cls} group block transition hover:border-wood`}>
      {corpo}
    </Link>
  ) : (
    <div className={cls}>{corpo}</div>
  );
}

/** "What am I looking at" box shown at the top of each Acessos screen. */
export function Explicacao({ titulo = "O que você está vendo", children, dicas }: { titulo?: string; children: ReactNode; dicas?: ReactNode[] }) {
  return (
    <div className="rounded-2xl border border-wood/30 bg-[#f6efe6] px-5 py-4 text-sm leading-relaxed text-ink">
      <p className="font-semibold">{titulo}</p>
      <p className="mt-1 text-ink">{children}</p>
      {dicas?.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
          {dicas.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
