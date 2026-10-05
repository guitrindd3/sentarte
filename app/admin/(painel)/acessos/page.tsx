import Link from "next/link";
import { getAdminContent } from "@/lib/content-store";
import { estatisticasAtivas, relatorio, type Contagem, type Relatorio } from "@/lib/estatisticas";
import { Card } from "../../_ui";

const PERIODOS = [
  { dias: 1, rotulo: "Hoje" },
  { dias: 7, rotulo: "7 dias" },
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
];

const PAGINAS: Record<string, string> = {
  "/": "Página inicial",
  "/times": "Cadeiras de time",
  "/boho": "Cadeiras boho",
  "/desenhos": "Animes e desenhos",
  "/personalizar": "Monte a sua trama",
  "/c": "Cadeira montada (link do WhatsApp)",
  "/busca": "Busca",
  "/faq": "Perguntas frequentes",
  "/sobre": "Sobre",
  "/contato": "Contato",
  "/pedido": "Pedido pago (volta do Mercado Pago)",
  "/politica-de-envio": "Política de envio",
  "/politica-de-troca-e-devolucao": "Trocas e devoluções",
  "/politica-de-privacidade": "Privacidade",
  "/termos-de-uso": "Termos de uso",
};

const fmt = (n: number) => n.toLocaleString("pt-BR");

function Ranking({ itens, vazio, max = 8, nome = (s: string) => s }: { itens: Contagem; vazio: string; max?: number; nome?: (s: string) => string }) {
  if (itens.length === 0) return <p className="py-4 text-sm text-ink-soft">{vazio}</p>;
  const topo = itens[0].n;
  const total = itens.reduce((a, b) => a + b.n, 0);
  return (
    <ol className="space-y-2.5">
      {itens.slice(0, max).map((x) => (
        <li key={x.nome} className="group" title={`${nome(x.nome)}: ${fmt(x.n)} (${Math.round((x.n / total) * 100)}%)`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-ink">{nome(x.nome)}</span>
            <span className="shrink-0 font-semibold tabular-nums text-ink">{fmt(x.n)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-canvas-deep">
            <div className="h-2 rounded-full bg-wood transition-colors group-hover:bg-wood-dark" style={{ width: `${Math.max(3, (x.n / topo) * 100)}%` }} />
          </div>
        </li>
      ))}
      {itens.length > max ? <li className="pt-1 text-xs text-ink-soft">e mais {itens.length - max}</li> : null}
    </ol>
  );
}

function GraficoDias({ dias }: { dias: Relatorio["dias"] }) {
  const topo = Math.max(1, ...dias.map((d) => d.visitantes));
  const curto = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  const marcar = dias.length <= 10 ? 1 : dias.length <= 31 ? 5 : 15;
  return (
    <div>
      <div className="flex h-44 items-end gap-[2px]" role="img" aria-label="Visitantes por dia">
        {dias.map((d) => (
          <div key={d.dia} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[4px] bg-wood transition-colors group-hover:bg-wood-dark"
              style={{ height: d.visitantes ? `${Math.max(3, (d.visitantes / topo) * 100)}%` : "2px", opacity: d.visitantes ? 1 : 0.25 }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-espresso px-2.5 py-1.5 text-xs text-paper shadow-lg group-hover:block">
              <span className="font-semibold">{curto(d.dia)}</span>: {fmt(d.visitantes)} visitantes, {fmt(d.views)} páginas
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[2px] border-t border-line pt-1.5 text-[0.7rem] text-ink-soft">
        {dias.map((d, i) => (
          <span key={d.dia} className="flex-1 text-center">
            {i % marcar === 0 || i === dias.length - 1 ? curto(d.dia) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function Horas({ horas }: { horas: Contagem }) {
  const mapa = new Map(horas.map((h) => [Number(h.nome), h.n]));
  const topo = Math.max(1, ...horas.map((h) => h.n));
  const pico = horas.length ? horas.reduce((a, b) => (b.n > a.n ? b : a)) : null;
  return (
    <div>
      <div className="grid grid-cols-12 gap-1">
        {Array.from({ length: 24 }, (_, h) => {
          const n = mapa.get(h) ?? 0;
          return (
            <div
              key={h}
              title={`${h}h: ${fmt(n)} páginas vistas`}
              className="flex aspect-square items-center justify-center rounded-md text-[0.65rem] font-medium"
              style={{
                background: n ? `color-mix(in oklab, var(--wood) ${15 + (n / topo) * 85}%, var(--canvas-deep))` : "var(--canvas-deep)",
                color: n / topo > 0.55 ? "var(--paper)" : "var(--ink-soft)",
              }}
            >
              {h}h
            </div>
          );
        })}
      </div>
      {pico ? <p className="mt-3 text-sm text-ink-soft">Horário de mais movimento: <strong className="text-ink">{pico.nome}h às {Number(pico.nome) + 1}h</strong>.</p> : null}
    </div>
  );
}

export default async function Acessos({ searchParams }: PageProps<"/admin/acessos">) {
  const { dias: diasParam } = await searchParams;
  const dias = PERIODOS.find((p) => String(p.dias) === diasParam)?.dias ?? 30;

  if (!estatisticasAtivas()) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Acessos do site</h1>
        <Card>
          <p className="text-ink">A contagem de acessos ainda não foi ligada.</p>
          <p className="mt-2 text-sm text-ink-soft">Falta criar o banco grátis de estatísticas na Vercel. Assim que ele existir, os números começam a aparecer aqui.</p>
        </Card>
      </div>
    );
  }

  let r: Relatorio | null = null;
  try {
    r = await relatorio(dias);
  } catch (err) {
    console.error("relatorio", err);
  }
  const { categorias } = await getAdminContent();
  const nomeCategoria = new Map(categorias.map((c) => [`/categoria/${c.slug}`, c.titulo]));
  const nomePagina = (p: string) => PAGINAS[p] ?? nomeCategoria.get(p) ?? p;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Acessos do site</h1>
          <p className="mt-2 max-w-prose text-ink-soft">Quem visitou, o que procurou e onde clicou. Contagem anônima; suas visitas logada no painel não entram.</p>
        </div>
        <div className="flex rounded-full border border-line bg-paper p-1">
          {PERIODOS.map((p) => (
            <Link
              key={p.dias}
              href={`/admin/acessos?dias=${p.dias}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${p.dias === dias ? "bg-espresso text-paper" : "text-ink-soft hover:text-ink"}`}
            >
              {p.rotulo}
            </Link>
          ))}
        </div>
      </div>

      {!r ? (
        <Card>
          <p className="text-sm text-clay-dark">Não deu para carregar os números agora. Tente recarregar a página daqui a pouco.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              { n: r.visitantes, rotulo: "visitantes", dica: "pessoas diferentes" },
              { n: r.views, rotulo: "páginas vistas", dica: r.visitantes ? `${(r.views / r.visitantes).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} por visitante` : "" },
              { n: r.whatsapp, rotulo: "cliques no WhatsApp", dica: "pedidos e dúvidas" },
              { n: r.carrinho, rotulo: "cadeiras no carrinho", dica: "vezes que adicionaram" },
            ].map((x) => (
              <div key={x.rotulo} className="rounded-2xl border border-line/70 bg-paper p-4 sm:p-5">
                <p className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{fmt(x.n)}</p>
                <p className="mt-1 text-sm font-medium text-ink">{x.rotulo}</p>
                <p className="text-xs text-ink-soft">{x.dica}</p>
              </div>
            ))}
          </div>

          {dias > 1 ? (
            <Card titulo="Visitantes por dia" descricao="Passe o mouse numa barra para ver o número do dia.">
              <GraficoDias dias={r.dias} />
            </Card>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card titulo="Páginas mais vistas">
              <Ranking itens={r.grupos.pag} nome={nomePagina} vazio="Nenhuma visita nesse período ainda." />
            </Card>
            <Card titulo="O que mais pesquisaram" descricao="Na lupa do site e na busca de trançado do Monte a sua trama.">
              <Ranking itens={r.grupos.busca} vazio="Ninguém pesquisou nada ainda." />
            </Card>
            <Card titulo="Onde mais clicaram" descricao="Botões e links do site.">
              <Ranking itens={r.grupos.clique} max={10} vazio="Nenhum clique registrado ainda." />
            </Card>
            <Card titulo="Cadeiras mais colocadas no carrinho">
              <Ranking itens={r.grupos.carrinho} vazio="Ninguém colocou cadeira no carrinho ainda." />
            </Card>
            <Card titulo="De onde vieram" descricao="Como a pessoa chegou ao site.">
              <Ranking itens={r.grupos.ref} vazio="Sem dados ainda." />
            </Card>
            <Card titulo="Cidades" descricao="Aproximada, pela internet de quem visitou.">
              <Ranking itens={r.grupos.local} vazio="Sem dados ainda." />
            </Card>
            <Card titulo="Celular ou computador">
              <Ranking itens={r.grupos.disp} vazio="Sem dados ainda." />
            </Card>
            <Card titulo="Horários" descricao="Quanto mais escuro, mais movimento.">
              <Horas horas={r.grupos.hora} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
