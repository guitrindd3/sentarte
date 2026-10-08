import Link from "next/link";
import { getAdminContent } from "@/lib/content-store";
import {
  estatisticasAtivas,
  GRUPOS_DETALHE,
  serieDoItem,
  ultimosDias,
  visitasRecentes,
  type Contagem,
  type GrupoDetalhe,
  type Visita,
} from "@/lib/estatisticas";
import { nomeDaPagina } from "@/lib/paginas";
import { Card } from "../../../_ui";
import { diaCurto, fmt, GraficoDias, Numero, Ranking } from "../graficos";

// Detail of one item of the "Acessos" summary (2026-10-08, user: "quero poder
// clicar em algumas coisas e ver mais detalhado"): its day-by-day count from the
// daily counters, plus what the visits that touched it did (visit journeys,
// kept 30 days).

const PERIODOS = [7, 30, 90];

const TITULO: Record<GrupoDetalhe, string> = {
  pag: "Página",
  busca: "Pesquisa",
  clique: "Clique em",
  carrinho: "Cadeira no carrinho",
  ref: "Vieram de",
  local: "Cidade",
  disp: "Aparelho",
  hora: "Horário",
};

const UNIDADE: Record<GrupoDetalhe, string> = {
  pag: "vezes que a página foi aberta",
  busca: "pesquisas",
  clique: "cliques",
  carrinho: "vezes no carrinho",
  ref: "chegadas ao site",
  local: "chegadas ao site",
  disp: "páginas vistas",
  hora: "páginas vistas nesse horário",
};

const horaBR = (t: number) =>
  Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(new Date(t)));
const quando = (t: number) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(t));

/** Did this visit touch the item? */
function tocou(v: Visita, g: GrupoDetalhe, valor: string) {
  const alvo = valor.toLowerCase();
  switch (g) {
    case "pag":
      return v.passos.some((p) => p.k === "v" && p.x === valor);
    case "busca":
      return v.passos.some((p) => {
        if (p.k === "b") return (p.q === "trama" ? `${p.x} (Monte a sua trama)` : p.x).toLowerCase() === alvo;
        return p.k === "v" && p.q?.toLowerCase() === alvo;
      });
    case "clique":
      return v.passos.some((p) => p.k === "c" && p.x === valor);
    case "carrinho":
      return v.passos.some((p) => p.k === "a" && p.x === valor);
    case "ref":
      return (v.origem ?? "Direto (link ou digitou)") === valor;
    case "local":
      return v.local === valor;
    case "disp":
      return v.disp === valor;
    case "hora":
      return v.passos.some((p) => p.t && horaBR(p.t) === Number(valor));
  }
}

/** Start of the last `dias` days (outside the component: Date.now is impure). */
function inicioDoPeriodo(dias: number) {
  return Date.now() - dias * 86400000;
}

function contar(valores: (string | undefined)[]): Contagem {
  const m = new Map<string, number>();
  for (const v of valores) if (v) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m].map(([nome, n]) => ({ nome, n })).sort((a, b) => b.n - a.n);
}

export default async function Detalhe({ searchParams }: PageProps<"/admin/acessos/detalhe">) {
  const { g: gParam, v: vParam, dias: diasParam } = await searchParams;
  const g = GRUPOS_DETALHE.find((x) => x === gParam);
  const valor = typeof vParam === "string" ? vParam.slice(0, 120) : "";
  const dias = PERIODOS.find((p) => String(p) === diasParam) ?? 30;
  const voltar = (
    <Link href={`/admin/acessos?dias=${dias}`} className="inline-block text-sm font-medium text-ink-soft hover:text-ink">
      ‹ Voltar ao resumo
    </Link>
  );

  if (!g || !valor || !estatisticasAtivas()) {
    return (
      <div className="space-y-6">
        {voltar}
        <Card>
          <p className="text-sm text-ink-soft">Não encontrei esse item. Volte ao resumo e clique de novo.</p>
        </Card>
      </div>
    );
  }

  const { categorias } = await getAdminContent();
  const nomePagina = (p: string) => nomeDaPagina(p, categorias);
  const nome = g === "pag" ? nomePagina(valor) : g === "hora" ? `${valor}h às ${Number(valor) + 1}h` : valor;
  const detalhe = (grupo: GrupoDetalhe) => (v: string) => `/admin/acessos/detalhe?g=${grupo}&v=${encodeURIComponent(v)}&dias=${dias}`;

  let serie: { dia: string; n: number }[] = [];
  let visitas: Visita[] = [];
  try {
    [serie, visitas] = await Promise.all([serieDoItem(g, valor, ultimosDias(dias)), visitasRecentes(300)]);
  } catch (err) {
    console.error("detalhe acessos", err);
  }
  const desde = inicioDoPeriodo(Math.min(dias, 30));
  const daqui = visitas.filter((v) => v.inicio >= desde && tocou(v, g, valor));

  const total = serie.reduce((a, d) => a + d.n, 0);
  const melhor = serie.reduce<{ dia: string; n: number } | null>((a, d) => (d.n > (a?.n ?? 0) ? d : a), null);
  const comMovimento = serie.filter((d) => d.n > 0).length;

  const fizeram = [
    { t: "colocaram cadeira no carrinho", n: daqui.filter((v) => v.carrinho).length },
    { t: "clicaram no WhatsApp", n: daqui.filter((v) => v.whatsapp).length },
    { t: "foram pagar", n: daqui.filter((v) => v.pagar).length },
    { t: "pagaram", n: daqui.filter((v) => v.pagou).length },
  ];
  const outrasPaginas = contar(daqui.flatMap((v) => [...new Set(v.passos.filter((p) => p.k === "v" && !(g === "pag" && p.x === valor)).map((p) => p.x))]));
  const cadeiras = contar(daqui.flatMap((v) => [...new Set(v.passos.filter((p) => p.k === "a").map((p) => p.x))]));

  return (
    <div className="space-y-6">
      {voltar}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-soft">{TITULO[g]}</p>
          <h1 className="break-words font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">{nome}</h1>
        </div>
        <div className="flex rounded-full border border-line bg-paper p-1">
          {PERIODOS.map((p) => (
            <Link
              key={p}
              href={`/admin/acessos/detalhe?g=${g}&v=${encodeURIComponent(valor)}&dias=${p}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${p === dias ? "bg-espresso text-paper" : "text-ink-soft hover:text-ink"}`}
            >
              {p} dias
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Numero n={total} rotulo={UNIDADE[g]} dica={`nos últimos ${dias} dias`} />
        <Numero n={total ? (total / dias).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "0"} rotulo="por dia, em média" />
        <Numero n={melhor ? diaCurto(melhor.dia) : "–"} rotulo="dia de mais movimento" dica={melhor ? `${fmt(melhor.n)} nesse dia` : undefined} href={melhor ? `/admin/acessos?dia=${melhor.dia}` : undefined} />
        <Numero n={comMovimento} rotulo={comMovimento === 1 ? "dia com movimento" : "dias com movimento"} dica={`de ${dias}`} />
      </div>

      <Card titulo="Dia a dia" descricao="Clique numa barra para ver tudo o que aconteceu no site naquele dia.">
        <GraficoDias rotulo={UNIDADE[g]} dias={serie} href={(d) => `/admin/acessos?dia=${d}`} />
      </Card>

      <Card
        titulo="O que essas pessoas fizeram"
        descricao={`${fmt(daqui.length)} ${daqui.length === 1 ? "visita passou" : "visitas passaram"} por aqui nos últimos ${Math.min(dias, 30)} dias (o passo a passo das visitas fica guardado 30 dias).`}
      >
        {daqui.length === 0 ? (
          <p className="text-sm text-ink-soft">Nenhuma visita guardada passou por aqui ainda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {fizeram.map((x) => (
              <div key={x.t} className="rounded-xl bg-canvas px-4 py-3">
                <p className="font-serif text-2xl font-semibold text-ink">
                  {fmt(x.n)} <span className="text-sm font-normal text-ink-soft">({Math.round((x.n / daqui.length) * 100)}%)</span>
                </p>
                <p className="text-sm text-ink">{x.t}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {daqui.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card titulo={g === "pag" ? "Também abriram" : "Páginas que abriram"}>
            <Ranking itens={outrasPaginas} nome={nomePagina} href={detalhe("pag")} vazio="Não abriram outras páginas." />
          </Card>
          <Card titulo="Cadeiras que colocaram no carrinho">
            <Ranking itens={cadeiras} href={detalhe("carrinho")} vazio="Ninguém dessas visitas colocou cadeira no carrinho." />
          </Card>
          {g !== "ref" ? (
            <Card titulo="De onde vieram">
              <Ranking itens={contar(daqui.map((v) => v.origem ?? "Direto (link ou digitou)"))} href={detalhe("ref")} vazio="Sem dados." />
            </Card>
          ) : null}
          {g !== "local" ? (
            <Card titulo="Cidades">
              <Ranking itens={contar(daqui.map((v) => v.local))} href={detalhe("local")} vazio="Sem dados de cidade." />
            </Card>
          ) : null}
          {g !== "disp" ? (
            <Card titulo="Celular ou computador">
              <Ranking itens={contar(daqui.map((v) => v.disp))} href={detalhe("disp")} vazio="Sem dados." />
            </Card>
          ) : null}
        </div>
      ) : null}

      {daqui.length ? (
        <Card titulo="Visitas" descricao="As mais recentes primeiro. Clique para ver o passo a passo.">
          <ul className="divide-y divide-line/60">
            {daqui.slice(0, 20).map((v) => (
              <li key={v.id}>
                <Link href={`/admin/acessos/visitas?id=${v.id}`} className="group flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="min-w-0 text-sm">
                    <span className="font-semibold text-ink">{v.local ?? "Cidade desconhecida"}</span>
                    <span className="text-ink-soft">
                      , {v.disp?.toLowerCase() ?? "aparelho?"}, {quando(v.inicio)}, {v.passos.length} {v.passos.length === 1 ? "passo" : "passos"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    {v.pagou ? <span className="rounded-full bg-verde px-2 py-0.5 text-paper">Pagou</span> : null}
                    {v.carrinho ? <span className="rounded-full bg-wood/15 px-2 py-0.5 text-wood-dark">Carrinho</span> : null}
                    {v.whatsapp ? <span className="rounded-full bg-verde/15 px-2 py-0.5 text-verde-escuro">WhatsApp</span> : null}
                    <span aria-hidden className="text-ink-soft group-hover:text-ink">›</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {daqui.length > 20 ? <p className="pt-2 text-xs text-ink-soft">Mostrando 20 de {fmt(daqui.length)}.</p> : null}
        </Card>
      ) : null}
    </div>
  );
}
