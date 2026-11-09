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
import { TentaramComprar, tentativasDaSemana, type Tentativa } from "./tentaram-comprar";

const ICONES_ATALHO = [
  <path key="n" d="M12 5v14M5 12h14" />,
  <path key="f" d="M4 7.5A1.5 1.5 0 0 1 5.5 6h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 7.5v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM12 16a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z" />,
  <path key="d" d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 9.5h8M8 12.5h5" />,
  <path key="p" d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20zM14 3.5V8h4M10 12h5M10 15.5h5" />,
];

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
  let avaliacoesEsperando = 0;
  let orcamentosNovos = 0;
  let novosNaLista: Interessado[] = [];
  if (redisAtivo()) {
    try {
      const recentes = await pedidosRecentes(80);
      tentaram = await tentativas(recentes);
      // Paid orders the atelier still has to weave/ship.
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
  const fotos = modelos.reduce((n, m) => n + (m.imagemUrl ? 1 : 0) + (m.variantes?.length ?? 0) + (m.fotosExtras?.length ?? 0), 0);
  const cadeiras = content.categorias.find((c) => c.slug === "cadeiras") ?? visiveis[0];

  const numeros = [
    { n: modelos.length, rotulo: "modelos no site", href: "/admin/catalogo" },
    { n: fotos, rotulo: "fotos publicadas", href: "/admin/catalogo" },
    { n: content.depoimentos.length, rotulo: content.depoimentos.length === 1 ? "depoimento" : "depoimentos", href: "/admin/depoimentos" },
  ];

  const atalhos = [
    {
      href: cadeiras ? `/admin/catalogo?cat=${cadeiras.id}&novo=1` : "/admin/catalogo",
      titulo: "Cadastrar cadeira nova",
      texto: "Nome, foto e descrição de um modelo novo.",
    },
    { href: "/admin/catalogo", titulo: "Trocar fotos e textos", texto: "Escolha a cadeira e edite o que quiser." },
    { href: "/admin/depoimentos", titulo: "Adicionar depoimento", texto: "Elogio de cliente com foto da cadeira." },
    { href: "/admin/paginas", titulo: "Textos das páginas", texto: "Sobre, perguntas frequentes, políticas e a página inicial." },
  ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-espresso px-6 py-7 text-paper shadow-[0_24px_50px_-28px_rgba(20,14,8,0.8)] sm:px-9 sm:py-9">
        {/* soft woven-light glow, decorative */}
        <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-rattan/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-wood/40 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium text-rattan">{saudacao()}!</p>
          <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight sm:text-4xl">O que vamos mudar hoje?</h1>
          <p className="mt-2 max-w-prose text-sm text-paper/70 sm:text-base">
            Edite à vontade: nada vai para o site até você clicar em “Revisar e publicar”. Depois, um quadro mostra a publicação até ficar no ar.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {numeros.map((x) => (
              <Link
                key={x.rotulo}
                href={x.href}
                className="rounded-2xl bg-white/[0.07] px-3 py-3 ring-1 ring-white/10 transition hover:bg-white/[0.12] sm:px-4"
              >
                <p className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">{x.n}</p>
                <p className="mt-0.5 text-xs text-paper/60">{x.rotulo}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

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


      <section>
      <h2 className="mb-3 text-sm font-semibold text-ink-soft">Atalhos</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {atalhos.map((a, i) => (
          <Link
            key={a.href + i}
            href={a.href}
            className="group flex items-center gap-4 rounded-3xl border border-line/70 bg-paper p-4 shadow-[0_1px_2px_rgba(36,31,26,0.05)] transition hover:-translate-y-0.5 hover:border-wood/60 hover:shadow-[0_14px_30px_-20px_rgba(36,28,20,0.5)] active:scale-[0.99] sm:p-5"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-wood to-espresso text-paper shadow-[0_8px_18px_-8px_rgba(107,65,38,0.9)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                {ICONES_ATALHO[i]}
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink group-hover:text-wood-dark">{a.titulo}</span>
              <span className="block text-sm text-ink-soft">{a.texto}</span>
            </span>
            <span aria-hidden className="text-xl text-line transition group-hover:translate-x-0.5 group-hover:text-wood">›</span>
          </Link>
        ))}
      </div>
      </section>

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
