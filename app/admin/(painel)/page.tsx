import Image from "next/image";
import Link from "next/link";
import { avaliacoesPendentes } from "@/lib/avaliacoes";
import { listarInteressados, pedidosRecentes, recusasDosPedidos, type Interessado, type PedidoCliente } from "@/lib/clientes";
import { orcamentosRecentes } from "@/lib/orcamentos";
import { getAdminContent } from "@/lib/content-store";
import { githubConfigurado, ultimosCommits, type CommitResumo } from "@/lib/github-store";
import { ondeAparece } from "@/lib/admin-grupos";
import { CATEGORIAS_OCULTAS } from "@/lib/offer";
import { redisAtivo } from "@/lib/redis";
import { Card } from "../_ui";
import { ICONES, Icone } from "./menu";
import { TentaramComprar, tentativasDaSemana, type Tentativa } from "./tentaram-comprar";


function saudacao() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

/** People who joined the WhatsApp news list in the last 7 days. */
function novosInteressados(lista: Interessado[]) {
  const desde = Date.now() - 7 * 86400000;
  return lista.filter((i) => i.em > desde);
}

/** Refused or unfinished payments this week, with each card refusal's reason. */
async function tentativas(pedidos: PedidoCliente[]): Promise<{ lista: Tentativa[]; agora: number }> {
  const agora = Date.now();
  const ps = tentativasDaSemana(pedidos, agora).slice(0, 8);
  const recusas = await recusasDosPedidos(ps.filter((p) => p.status === "recusado").map((p) => p.ref));
  return { lista: ps.map((p) => ({ p, recusas: recusas.get(p.ref) ?? [] })), agora };
}

const mes = (ms: number) => new Intl.DateTimeFormat("pt-BR", { month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(ms));

/** Paid orders of this month (Brasília), from the latest orders. */
function vendasDoMes(pagos: PedidoCliente[]) {
  const agora = mes(Date.now());
  return pagos.filter((p) => mes(p.pagoEm ?? p.em) === agora);
}

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: v >= 1000 ? 0 : 2 });

const ETAPAS = {
  producao: { rotulo: "Fazer", cor: "bg-rattan/20 text-wood-dark" },
  enviado: { rotulo: "Enviado", cor: "bg-canvas-deep text-ink-soft" },
  entregue: { rotulo: "Entregue", cor: "bg-verde/10 text-verde-escuro" },
} as const;

function quando(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}

export default async function VisaoGeral() {
  const content = await getAdminContent();
  let historico: CommitResumo[] = [];
  if (githubConfigurado()) {
    try {
      historico = (await ultimosCommits(40)).filter((c) => c.mensagem.startsWith("Painel:")).slice(0, 6);
    } catch {}
  }

  // Carts that went to Mercado Pago and never got paid, last 7 days; reviews waiting for approval.
  let tentaram: { lista: Tentativa[]; agora: number } = { lista: [], agora: 0 };
  let paraEnviar: PedidoCliente[] = [];
  let pagos: PedidoCliente[] = [];
  let avaliacoesEsperando = 0;
  let orcamentosNovos = 0;
  let novosNaLista: Interessado[] = [];
  if (redisAtivo()) {
    try {
      const recentes = await pedidosRecentes(80);
      tentaram = await tentativas(recentes);
      // Paid orders the atelier still has to weave/ship.
      pagos = recentes.filter((p) => p.status === "pago");
      paraEnviar = recentes.filter((p) => p.status === "pago" && (p.etapa ?? "producao") === "producao");
      avaliacoesEsperando = (await avaliacoesPendentes()).length;
      orcamentosNovos = (await orcamentosRecentes(50)).filter((o) => o.status === "novo").length;
      novosNaLista = novosInteressados(await listarInteressados());
    } catch {}
  }

  const visiveis = content.categorias.filter((c) => !CATEGORIAS_OCULTAS.has(c.slug));
  const modelos = visiveis.flatMap((c) => c.modelos.map((m) => ({ ...m, cat: c })));
  // Collection covers like "Monte a sua trama" use a video, not a photo.
  const semFoto = modelos.filter((m) => !m.imagemUrl && !ondeAparece(m.nome, m.cat.slug).capa);
  const cadeiras = content.categorias.find((c) => c.slug === "cadeiras") ?? visiveis[0];

  const doMes = vendasDoMes(pagos);
  const totalMes = doMes.reduce((n, p) => n + p.valor, 0);
  const ultimosPagos = [...pagos].sort((x, y) => (y.pagoEm ?? y.em) - (x.pagoEm ?? x.em)).slice(0, 4);

  const numeros = [
    { n: String(paraEnviar.length), rotulo: paraEnviar.length === 1 ? "pedido para fazer" : "pedidos para fazer", href: "/admin/clientes", destaque: paraEnviar.length > 0 },
    { n: reais(totalMes), rotulo: `${doMes.length} ${doMes.length === 1 ? "venda" : "vendas"} no mês`, href: "/admin/clientes", destaque: false },
    { n: String(orcamentosNovos), rotulo: orcamentosNovos === 1 ? "orçamento novo" : "orçamentos novos", href: "/admin/orcamentos", destaque: orcamentosNovos > 0 },
  ];

  const acoes = [
    { href: "/admin/vendas/nova", rotulo: "Lançar venda", icone: ICONES.venda },
    { href: cadeiras ? `/admin/catalogo?cat=${cadeiras.id}&novo=1` : "/admin/catalogo", rotulo: "Cadeira nova", icone: ICONES.cadeiras },
    { href: "/admin/clientes", rotulo: "Pedidos", icone: ICONES.clientes },
    { href: "/admin/orcamentos", rotulo: "Orçamentos", icone: ICONES.orcamentos },
    { href: "/admin/montar", rotulo: "Montar trama", icone: ICONES.montar },
    { href: "/admin/cupons", rotulo: "Cupons", icone: ICONES.cupons },
    { href: "/admin/cartoes", rotulo: "Cartões", icone: ICONES.cartoes },
    { href: "/admin/depoimentos", rotulo: "Avaliações", icone: ICONES.depoimentos },
  ];

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="relative -mx-4 -mt-6 overflow-hidden bg-espresso px-5 pb-6 pt-5 text-paper sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-9 sm:py-9 sm:shadow-[0_24px_50px_-28px_rgba(20,14,8,0.8)]">
        {/* soft woven-light glow, decorative */}
        <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-rattan/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-wood/40 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium text-rattan">{saudacao()}!</p>
          <h1 className="mt-1 font-serif text-[1.9rem] font-medium leading-tight tracking-tight sm:text-4xl">
            {paraEnviar.length
              ? `${paraEnviar.length} ${paraEnviar.length === 1 ? "pedido esperando" : "pedidos esperando"} por você`
              : "Tudo em dia no ateliê"}
          </h1>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {numeros.map((x) => (
              <Link
                key={x.rotulo}
                href={x.href}
                className={`rounded-2xl px-3 py-3 ring-1 transition sm:px-4 ${x.destaque ? "bg-rattan/20 ring-rattan/50" : "bg-white/[0.07] ring-white/10 hover:bg-white/[0.12]"}`}
              >
                <p className={`font-serif font-semibold tracking-tight ${x.n.length > 6 ? "text-lg sm:text-2xl" : "text-2xl sm:text-3xl"}`}>{x.n}</p>
                <p className="mt-0.5 text-xs leading-snug text-paper/65">{x.rotulo}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 px-1 text-sm font-semibold text-ink-soft">Acesso rápido</h2>
        <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:gap-4 lg:grid-cols-8">
          {acoes.map((a) => (
            <Link key={a.rotulo} href={a.href} className="group flex flex-col items-center gap-1.5 text-center active:scale-95">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-espresso text-rattan shadow-[0_10px_20px_-12px_rgba(20,14,8,0.9)] transition group-hover:bg-espresso-soft sm:h-16 sm:w-16">
                <Icone className="h-6 w-6">{a.icone}</Icone>
              </span>
              <span className="text-[0.78rem] font-medium leading-tight text-ink">{a.rotulo}</span>
            </Link>
          ))}
        </div>
      </section>

      <TentaramComprar lista={tentaram.lista} agora={tentaram.agora} />

      {paraEnviar.length ? (
        <Link
          href={paraEnviar.length === 1 ? `/admin/clientes/${paraEnviar[0].ref}` : "/admin/clientes"}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-verde bg-verde/10 px-5 py-4 transition hover:bg-verde/15"
        >
          <span>
            <span className="block font-semibold text-verde-escuro">
              {paraEnviar.length} {paraEnviar.length === 1 ? "pedido pago para fazer e enviar" : "pedidos pagos para fazer e enviar"}
            </span>
            <span className="block text-sm text-ink">{paraEnviar.slice(0, 3).map((p) => p.nome.split(" ")[0]).join(", ")}. Abra o pedido para ver o endereço e gerar a etiqueta.</span>
          </span>
          <span className="rounded-full bg-verde px-4 py-2 text-sm font-semibold text-paper">Ver {paraEnviar.length === 1 ? "pedido" : "pedidos"}</span>
        </Link>
      ) : null}

      {orcamentosNovos ? (
        <Link
          href="/admin/orcamentos"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-clay/50 bg-clay/10 px-5 py-4 transition hover:border-clay"
        >
          <span className="font-semibold text-clay-dark">
            {orcamentosNovos} {orcamentosNovos === 1 ? "pedido de orçamento novo" : "pedidos de orçamento novos"} (página Eventos)
          </span>
          <span className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-paper">Ver orçamentos</span>
        </Link>
      ) : null}

      {avaliacoesEsperando ? (
        <Link
          href="/admin/depoimentos"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-rattan/50 bg-rattan/10 px-5 py-4 transition hover:border-wood"
        >
          <span className="font-semibold text-wood-dark">
            ★ {avaliacoesEsperando} {avaliacoesEsperando === 1 ? "avaliação nova esperando" : "avaliações novas esperando"} a sua aprovação
          </span>
          <span className="rounded-full bg-wood px-4 py-2 text-sm font-semibold text-paper">Ver avaliações</span>
        </Link>
      ) : null}

      {novosNaLista.length ? (
        <Link
          href="/admin/clientes"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-verde/30 bg-verde/5 px-5 py-4 transition hover:border-verde"
        >
          <span>
            <span className="block font-semibold text-verde-escuro">
              {novosNaLista.length} {novosNaLista.length === 1 ? "pessoa entrou" : "pessoas entraram"} na lista de novidades esta semana
            </span>
            <span className="block text-sm text-ink">
              {novosNaLista.slice(0, 3).map((i) => i.nome.split(" ")[0]).join(", ")}. Mande uma novidade ou um cupom pelo WhatsApp.
            </span>
          </span>
          <span className="rounded-full bg-verde px-4 py-2 text-sm font-semibold text-paper">Ver lista</span>
        </Link>
      ) : null}


      {ultimosPagos.length ? (
        <section>
          <div className="mb-3 flex items-baseline justify-between px-1">
            <h2 className="text-sm font-semibold text-ink-soft">Últimos pedidos pagos</h2>
            <Link href="/admin/clientes" className="text-sm font-semibold text-wood">Ver todos</Link>
          </div>
          <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl border border-line/70 bg-paper">
            {ultimosPagos.map((p) => {
              const etapa = ETAPAS[p.etapa ?? "producao"];
              return (
                <li key={p.ref}>
                  <Link href={`/admin/clientes/${p.ref}`} className="flex items-center gap-3 px-4 py-3 active:bg-canvas">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-canvas-deep font-serif text-lg font-semibold text-wood-dark">
                      {p.nome.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{p.nome.split(" ").slice(0, 2).join(" ")}</span>
                      <span className="block truncate text-xs text-ink-soft">{p.itens.join(", ")}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold text-ink">{reais(p.valor)}</span>
                      <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${etapa.cor}`}>{etapa.rotulo}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card titulo="Últimas alterações" descricao="O que foi salvo pelo painel, da mais nova para a mais antiga.">
          {historico.length ? (
            <ol className="space-y-3">
              {historico.map((c) => (
                <li key={c.sha} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rattan" />
                  <span className="flex-1 text-ink">
                    {c.mensagem.replace(/^Painel:\s*/, "").replace(/^./, (l) => l.toUpperCase())}
                  </span>
                  <span className="shrink-0 text-xs text-ink-soft">{quando(c.data)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-soft">Nada salvo pelo painel ainda.</p>
          )}
        </Card>

        <Card titulo="Falta foto" descricao={semFoto.length ? "Modelos que aparecem no site só com o desenho do trançado." : undefined}>
          {semFoto.length ? (
            <ul className="space-y-2">
              {semFoto.slice(0, 6).map((m) => (
                <li key={m.id}>
                  <Link href={`/admin/catalogo/${m.cat.id}/${m.id}`} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm hover:bg-canvas">
                    <span className="font-medium text-ink">{m.nome}</span>
                    <span className="text-xs font-semibold text-wood">Colocar foto</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-3 text-sm text-ink-soft">
              <Image src="/brand/logo.png" alt="" width={36} height={36} className="rounded-full" />
              Todas as cadeiras do site têm foto. Capricho!
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
