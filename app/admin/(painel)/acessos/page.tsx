import Link from "next/link";
import { getAdminContent } from "@/lib/content-store";
import { diaBR, estatisticasAtivas, relatorio, relatorioDosDias, type Contagem, type Relatorio } from "@/lib/estatisticas";
import { nomeDaPagina } from "@/lib/paginas";
import { Card } from "../../_ui";
import { AbasAcessos } from "./abas";
import { diaCurto, Explicacao, fmt, GraficoDias, Numero, Ranking } from "./graficos";

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
          <p className="mt-2 max-w-prose text-ink-soft">Suas próprias visitas, com o painel aberto, não entram na conta.</p>
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
        <>
          <Explicacao
            titulo={`Você está vendo só o dia ${diaCurto(umDia)}`}
            dicas={[
              "Os números e as listas abaixo contam apenas o que aconteceu nesse dia.",
              "Para ver cada pessoa que entrou nesse dia, passo a passo, use o botão “Ver as visitas desse dia”.",
            ]}
          >
            Este é o mesmo resumo de sempre, mas filtrado para um único dia, o que você clicou no gráfico.
          </Explicacao>
          <div className="flex flex-wrap gap-2 text-sm font-medium">
            <Link href={`/admin/acessos/visitas?d=${umDia}`} className="rounded-full bg-espresso px-4 py-2 text-paper hover:bg-ink">
              Ver as visitas desse dia
            </Link>
            <Link href="/admin/acessos?dias=30" className="rounded-full border border-line bg-paper px-4 py-2 text-ink hover:border-wood">
              Voltar aos 30 dias
            </Link>
          </div>
        </>
      ) : (
        <Explicacao
          dicas={[
            "Escolha o período no canto direito: Hoje, 7, 30 ou 90 dias.",
            "Clique em qualquer número, barra do gráfico ou linha das listas para abrir os detalhes daquilo.",
            "Ninguém é identificado: não aparece nome nem telefone, só cidade aproximada, aparelho e de onde a pessoa veio.",
          ]}
        >
          Um resumo de quem entrou no site no período escolhido: quantas pessoas vieram, o que olharam, o que pesquisaram, onde clicaram e quais cadeiras
          colocaram no carrinho.
        </Explicacao>
      )}

      {!r ? (
        <Card>
          <p className="text-sm text-clay-dark">Não deu para carregar os números agora. Tente recarregar a página daqui a pouco.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Numero n={r.visitantes} rotulo="visitantes" dica="pessoas diferentes que entraram" href={umDia ? `/admin/acessos/visitas?d=${umDia}` : "/admin/acessos/visitas"} />
            <Numero
              n={r.views}
              rotulo="páginas vistas"
              dica={r.visitantes ? `cada pessoa abriu ${(r.views / r.visitantes).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} páginas, em média` : "quantas páginas foram abertas"}
              href="#paginas"
            />
            <Numero n={r.whatsapp} rotulo="cliques no WhatsApp" dica="vezes que tocaram para falar com você" href="/admin/acessos/visitas?f=whatsapp" />
            <Numero n={r.carrinho} rotulo="cadeiras no carrinho" dica="vezes que colocaram uma cadeira no carrinho" href="/admin/acessos/visitas?f=carrinho" />
          </div>

          {!umDia && dias > 1 ? (
            <Card titulo="Visitantes por dia" descricao="Cada barra é um dia: quanto mais alta, mais gente entrou. Passe o mouse para ver o número e clique para ver tudo o que aconteceu naquele dia.">
              <GraficoDias
                rotulo="Visitantes"
                dias={r.dias.map((d) => ({ dia: d.dia, n: d.visitantes, extra: `${fmt(d.visitantes)} visitantes, ${fmt(d.views)} páginas` }))}
                href={(d) => `/admin/acessos?dia=${d}`}
              />
            </Card>
          ) : null}

          <p className="text-sm text-ink-soft">
            Nas listas abaixo, o número é quantas vezes aconteceu e a porcentagem é a parte daquele item no total da lista. Clique numa linha para ver os detalhes.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            <div id="paginas" className="scroll-mt-24">
              <Card titulo="Páginas mais vistas" descricao="Quantas vezes cada página do site foi aberta.">
                <Ranking itens={r.grupos.pag} nome={nomePagina} href={detalhe("pag")} vazio="Nenhuma visita nesse período ainda." />
              </Card>
            </div>
            <Card titulo="O que mais pesquisaram" descricao="O que as pessoas digitaram na lupa do site e na busca de trançados do Monte a sua trama. Mostra o que procuram e talvez não encontrem.">
              <Ranking itens={r.grupos.busca} href={detalhe("busca")} vazio="Ninguém pesquisou nada ainda." />
            </Card>
            <Card titulo="Onde mais clicaram" descricao="Quais botões e links foram tocados (Comprar, WhatsApp, Instagram, menus…).">
              <Ranking itens={r.grupos.clique} max={10} href={detalhe("clique")} vazio="Nenhum clique registrado ainda." />
            </Card>
            <Card titulo="Cadeiras mais colocadas no carrinho" descricao="Quais cadeiras despertam mais interesse de compra.">
              <Ranking itens={r.grupos.carrinho} href={detalhe("carrinho")} vazio="Ninguém colocou cadeira no carrinho ainda." />
            </Card>
            <Card titulo="De onde vieram" descricao="Por onde a pessoa chegou: Google, Instagram, WhatsApp… “Direto” é quem digitou o endereço ou abriu um link que não diz de onde veio.">
              <Ranking itens={r.grupos.ref} href={detalhe("ref")} vazio="Sem dados ainda." />
            </Card>
            <Card titulo="Cidades" descricao="De onde as pessoas acessaram. É aproximada (vem da internet da pessoa), às vezes mostra uma cidade vizinha.">
              <Ranking itens={r.grupos.local} href={detalhe("local")} vazio="Sem dados ainda." />
            </Card>
            <Card titulo="Celular ou computador" descricao="Em que aparelho as páginas foram abertas.">
              <Ranking itens={r.grupos.disp} href={detalhe("disp")} vazio="Sem dados ainda." />
            </Card>
            <Card titulo="Horários" descricao="Em que horas do dia o site tem mais movimento (horário de Brasília). Quanto mais escuro o quadrado, mais páginas abertas. Clique numa hora para ver os detalhes.">
              <Horas horas={r.grupos.hora} href={detalhe("hora")} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
