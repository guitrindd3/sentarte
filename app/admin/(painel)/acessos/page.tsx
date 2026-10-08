import Link from "next/link";
import { getAdminContent } from "@/lib/content-store";
import { diaBR, estatisticasAtivas, relatorio, relatorioDosDias, type Contagem, type Relatorio } from "@/lib/estatisticas";
import { nomeDaPagina } from "@/lib/paginas";
import { Card } from "../../_ui";
import { AbasAcessos } from "./abas";
import { diaCurto, fmt, GraficoDias, Numero, Ranking } from "./graficos";

const PERIODOS = [
  { dias: 1, rotulo: "Hoje" },
  { dias: 7, rotulo: "7 dias" },
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
];


function Horas({ horas, href }: { horas: Contagem; href: (h: string) => string }) {
  const mapa = new Map(horas.map((h) => [Number(h.nome), h.n]));
  const topo = Math.max(1, ...horas.map((h) => h.n));
  const pico = horas.length ? horas.reduce((a, b) => (b.n > a.n ? b : a)) : null;
  return (
    <div>
      <div className="grid grid-cols-12 gap-1">
        {Array.from({ length: 24 }, (_, h) => {
          const n = mapa.get(h) ?? 0;
          return (
            <Link
              key={h}
              href={href(String(h))}
              title={`${h}h: ${fmt(n)} páginas vistas. Clique para ver detalhes`}
              className="flex aspect-square items-center justify-center rounded-md text-[0.65rem] font-medium transition hover:ring-2 hover:ring-wood"
              style={{
                background: n ? `color-mix(in oklab, var(--wood) ${15 + (n / topo) * 85}%, var(--canvas-deep))` : "var(--canvas-deep)",
                color: n / topo > 0.55 ? "var(--paper)" : "var(--ink-soft)",
              }}
            >
              {h}h
            </Link>
          );
        })}
      </div>
      {pico ? <p className="mt-3 text-sm text-ink-soft">Horário de mais movimento: <strong className="text-ink">{pico.nome}h às {Number(pico.nome) + 1}h</strong>.</p> : null}
    </div>
  );
}

export default async function Acessos({ searchParams }: PageProps<"/admin/acessos">) {
  const { dias: diasParam, dia: diaParam } = await searchParams;
  const dias = PERIODOS.find((p) => String(p.dias) === diasParam)?.dias ?? 30;
  // One clicked day (from the chart), within what is still stored.
  const umDia = typeof diaParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(diaParam) && diaParam <= diaBR() ? diaParam : null;
  const periodo = umDia ? `dia=${umDia}` : `dias=${dias}`;
  const detalhe = (g: string) => (v: string) => `/admin/acessos/detalhe?g=${g}&v=${encodeURIComponent(v)}&${umDia ? `dias=30` : periodo}`;

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
    r = umDia ? await relatorioDosDias([umDia]) : await relatorio(dias);
  } catch (err) {
    console.error("relatorio", err);
  }
  const { categorias } = await getAdminContent();
  const nomePagina = (p: string) => nomeDaPagina(p, categorias);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Acessos do site</h1>
          <p className="mt-2 max-w-prose text-ink-soft">Quem visitou, o que procurou e onde clicou. Contagem anônima; suas visitas logada no painel não entram.</p>
          <AbasAcessos atual="resumo" />
        </div>
        <div className="flex rounded-full border border-line bg-paper p-1">
          {PERIODOS.map((p) => (
            <Link
              key={p.dias}
              href={`/admin/acessos?dias=${p.dias}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${!umDia && p.dias === dias ? "bg-espresso text-paper" : "text-ink-soft hover:text-ink"}`}
            >
              {p.rotulo}
            </Link>
          ))}
        </div>
      </div>

      {umDia ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-wood/40 bg-paper px-5 py-4">
          <p className="text-ink">
            Mostrando só o dia <strong>{diaCurto(umDia)}</strong>.
          </p>
          <div className="flex flex-wrap gap-2 text-sm font-medium">
            <Link href={`/admin/acessos/visitas?d=${umDia}`} className="rounded-full bg-espresso px-4 py-2 text-paper hover:bg-ink">
              Ver as visitas desse dia
            </Link>
            <Link href="/admin/acessos?dias=30" className="rounded-full border border-line px-4 py-2 text-ink hover:border-wood">
              Voltar aos 30 dias
            </Link>
          </div>
        </div>
      ) : null}

      {!r ? (
        <Card>
          <p className="text-sm text-clay-dark">Não deu para carregar os números agora. Tente recarregar a página daqui a pouco.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Numero n={r.visitantes} rotulo="visitantes" dica="pessoas diferentes" href={umDia ? `/admin/acessos/visitas?d=${umDia}` : "/admin/acessos/visitas"} />
            <Numero
              n={r.views}
              rotulo="páginas vistas"
              dica={r.visitantes ? `${(r.views / r.visitantes).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} por visitante` : ""}
              href="#paginas"
            />
            <Numero n={r.whatsapp} rotulo="cliques no WhatsApp" dica="pedidos e dúvidas" href="/admin/acessos/visitas?f=whatsapp" />
            <Numero n={r.carrinho} rotulo="cadeiras no carrinho" dica="vezes que adicionaram" href="/admin/acessos/visitas?f=carrinho" />
          </div>

          {!umDia && dias > 1 ? (
            <Card titulo="Visitantes por dia" descricao="Passe o mouse numa barra para ver o número do dia. Clique para ver tudo daquele dia.">
              <GraficoDias
                rotulo="Visitantes"
                dias={r.dias.map((d) => ({ dia: d.dia, n: d.visitantes, extra: `${fmt(d.visitantes)} visitantes, ${fmt(d.views)} páginas` }))}
                href={(d) => `/admin/acessos?dia=${d}`}
              />
            </Card>
          ) : null}

          <p className="text-sm text-ink-soft">Clique em qualquer item das listas abaixo para ver os detalhes: dia a dia e o que essas pessoas fizeram no site.</p>

          <div className="grid gap-6 lg:grid-cols-2">
            <div id="paginas" className="scroll-mt-24">
              <Card titulo="Páginas mais vistas">
                <Ranking itens={r.grupos.pag} nome={nomePagina} href={detalhe("pag")} vazio="Nenhuma visita nesse período ainda." />
              </Card>
            </div>
            <Card titulo="O que mais pesquisaram" descricao="Na lupa do site e na busca de trançado do Monte a sua trama.">
              <Ranking itens={r.grupos.busca} href={detalhe("busca")} vazio="Ninguém pesquisou nada ainda." />
            </Card>
            <Card titulo="Onde mais clicaram" descricao="Botões e links do site.">
              <Ranking itens={r.grupos.clique} max={10} href={detalhe("clique")} vazio="Nenhum clique registrado ainda." />
            </Card>
            <Card titulo="Cadeiras mais colocadas no carrinho">
              <Ranking itens={r.grupos.carrinho} href={detalhe("carrinho")} vazio="Ninguém colocou cadeira no carrinho ainda." />
            </Card>
            <Card titulo="De onde vieram" descricao="Como a pessoa chegou ao site.">
              <Ranking itens={r.grupos.ref} href={detalhe("ref")} vazio="Sem dados ainda." />
            </Card>
            <Card titulo="Cidades" descricao="Aproximada, pela internet de quem visitou.">
              <Ranking itens={r.grupos.local} href={detalhe("local")} vazio="Sem dados ainda." />
            </Card>
            <Card titulo="Celular ou computador">
              <Ranking itens={r.grupos.disp} href={detalhe("disp")} vazio="Sem dados ainda." />
            </Card>
            <Card titulo="Horários" descricao="Quanto mais escuro, mais movimento. Clique numa hora para ver os detalhes.">
              <Horas horas={r.grupos.hora} href={detalhe("hora")} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
