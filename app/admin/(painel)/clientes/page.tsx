import Link from "next/link";
import { atualizarComMercadoPago, listarInteressados, pedidosRecentes, type Interessado, type PedidoCliente } from "@/lib/clientes";
import { getAdminContent } from "@/lib/content-store";
import { formatBRL } from "@/lib/offer";
import { noPagamento } from "@/lib/pedido";
import { redisAtivo } from "@/lib/redis";
import { whatsappUrl } from "@/lib/urls";
import { editarInteressadoAction, excluirInteressadoAction, excluirPedidoAction } from "../../actions";
import { BotaoExcluir, Card } from "../../_ui";
import { listarCupons, motivoInvalido } from "@/lib/cupons-store";
import type { CupomPublico } from "@/lib/cupom";
import { EscolherCupom } from "./chamar-lista";
import { LinhaInteressado } from "./linha-interessado";
import { CopiarNumeros } from "./copiar";

const quando = (t: number) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(t));

function telefone(n: string) {
  const m = n.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : n;
}
const primeiroNome = (n: string) => n.trim().split(/\s+/)[0] ?? n;

/** "Didn't finish" = still waiting 30+ minutes after going to pay. */
function situacao(p: PedidoCliente, agora: number) {
  if (p.status === "pago" && p.etapa === "entregue") return { t: "Entregue", c: "bg-canvas-deep text-ink" };
  if (p.status === "pago" && p.etapa === "enviado") return { t: "Pago, enviado", c: "bg-verde/15 text-verde-escuro" };
  if (p.status === "pago") return { t: "Pago, fazer e enviar", c: "bg-verde text-paper" };
  if (p.status === "pendente") return { t: "Pagamento pendente", c: "bg-rattan/25 text-wood-dark" };
  if (p.status === "recusado") return { t: "Pagamento recusado", c: "bg-clay/15 text-clay-dark" };
  return agora - p.em > 30 * 60000 ? { t: "Não terminou", c: "bg-clay text-paper" } : { t: "Pagando agora…", c: "bg-canvas-deep text-ink" };
}

function mensagem(p: PedidoCliente) {
  const itens = p.itens.join(", ");
  if (p.status === "pago") return `Oi, ${primeiroNome(p.nome)}! Aqui é do Ateliê SentArte. Recebemos o pagamento do seu pedido (${itens}). Muito obrigado! Já vamos começar a produção.`;
  return `Oi, ${primeiroNome(p.nome)}! Aqui é do Ateliê SentArte. Vi que você começou um pedido no site (${itens}) e o pagamento não foi concluído. Posso te ajudar com alguma coisa?`;
}

function pedidoDeAvaliacao(nome: string, link: string) {
  return `Oi, ${primeiroNome(nome)}! Aqui é do Ateliê SentArte. Espero que esteja curtindo a sua cadeira! Se puder, deixa uma avaliação pra gente no Google? Leva 1 minutinho e ajuda muito o ateliê: ${link}`;
}

function referencias() {
  return { agora: Date.now() };
}

/** Order filters (2026-11-14): what the atelier looks for most. */
type Filtro = "fazer" | "enviados" | "naopagos" | "todos";
const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: "fazer", rotulo: "Para fazer" },
  { id: "enviados", rotulo: "Enviados" },
  { id: "naopagos", rotulo: "Não pagaram" },
  { id: "todos", rotulo: "Todos" },
];
function grupoDe(p: PedidoCliente): Filtro {
  if (p.status !== "pago") return "naopagos";
  return (p.etapa ?? "producao") === "producao" ? "fazer" : "enviados";
}

/** E-mails already sent to the customer, short names. */
function emailsEnviados(p: PedidoCliente) {
  const l = p.lembretes;
  if (!l) return [];
  return [
    l.pagar1 ? "lembrete 1 h" : "",
    l.pagar2 ? "lembrete 24 h" : "",
    l.confirmado ? "confirmado" : "",
    l.enviado ? "enviado" : "",
    l.rastreio ? "rastreio" : "",
    l.entregue ? "entregue" : "",
    l.avaliar ? "avaliação" : "",
  ].filter(Boolean);
}

// 2026-11-14 ("pode melhorar"): tabs (Pedidos / Lista / Avaliação) and order
// filters instead of one long page; each order is a compact card that opens it.
export default async function Clientes({ searchParams }: PageProps<"/admin/clientes">) {
  const { aba: abaParam, f: filtroParam } = await searchParams;
  if (!redisAtivo()) {
    return <Card titulo="Clientes"><p className="text-sm text-ink-soft">O banco do painel não está ligado.</p></Card>;
  }
  let pedidos: PedidoCliente[] = [];
  let lista: Interessado[] = [];
  let cupons: CupomPublico[] = [];
  try {
    const [p, l, c] = await Promise.all([pedidosRecentes().then(atualizarComMercadoPago), listarInteressados(), listarCupons()]);
    pedidos = p;
    lista = l;
    cupons = c
      .filter((x) => !motivoInvalido(x))
      .map(({ codigo, tipo, valor, minCadeiras, automatico }) => ({ codigo, tipo, valor, minCadeiras, automatico }));
  } catch (err) {
    console.error("clientes", err);
  }
  const { agora } = referencias();
  const { site } = await getAdminContent();
  const naoTerminou = pedidos.filter((p) => situacao(p, agora).t === "Não terminou").length;

  const aba = abaParam === "lista" || (abaParam === "avaliacao" && site.googleUrl) ? abaParam : "pedidos";
  const conta = (id: Filtro) => (id === "todos" ? pedidos.length : pedidos.filter((p) => grupoDe(p) === id).length);
  const filtro: Filtro = FILTROS.find((x) => x.id === filtroParam)?.id ?? (conta("fazer") ? "fazer" : "todos");
  const visiveis = filtro === "todos" ? pedidos : pedidos.filter((p) => grupoDe(p) === filtro);

  const abas = [
    { id: "pedidos", rotulo: "Pedidos", n: pedidos.length as number | null },
    { id: "lista", rotulo: "Novidades", n: lista.length as number | null },
    ...(site.googleUrl ? [{ id: "avaliacao", rotulo: "Google", n: null }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Clientes</h1>
          <p className="mt-1.5 max-w-prose text-sm text-ink-soft sm:text-base">Pedidos do site, vendas lançadas por você e a lista de novidades.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/vendas/nova" className="inline-flex items-center gap-1.5 rounded-full bg-espresso px-4 py-2.5 text-sm font-semibold text-paper hover:bg-espresso-soft">
            <span className="text-rattan">+</span> Lançar venda
          </Link>
          <Link href="/admin/orcamentos" className="inline-flex items-center rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-medium text-ink hover:border-wood">
            Orçamentos
          </Link>
        </div>
      </div>

      <nav aria-label="Seções" className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-espresso p-1 sm:inline-grid">
        {abas.map((x) => {
          const on = aba === x.id;
          return (
            <Link
              key={x.id}
              href={x.id === "pedidos" ? "/admin/clientes" : `/admin/clientes?aba=${x.id}`}
              aria-current={on ? "page" : undefined}
              className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 sm:px-5 text-sm font-semibold transition ${on ? "bg-paper text-ink" : "text-paper/70 hover:text-paper"}`}
            >
              {x.rotulo}
              {x.n !== null ? <span className={`rounded-full px-1.5 text-xs ${on ? "bg-rattan/25 text-wood-dark" : "bg-white/10"}`}>{x.n}</span> : null}
            </Link>
          );
        })}
      </nav>

      {aba === "pedidos" ? (
        <section className="space-y-4">
          {naoTerminou ? (
            <p className="rounded-2xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm font-medium text-clay-dark">
              {naoTerminou} {naoTerminou === 1 ? "pessoa foi pagar e não terminou" : "pessoas foram pagar e não terminaram"}. Vale chamar no WhatsApp!
            </p>
          ) : null}
          <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
            {FILTROS.map((x) => {
              const on = filtro === x.id;
              return (
                <Link
                  key={x.id}
                  href={`/admin/clientes?f=${x.id}`}
                  aria-current={on ? "true" : undefined}
                  className={`inline-flex flex-col items-center justify-center rounded-2xl border px-1 py-1.5 text-center text-xs font-medium leading-tight transition sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-3.5 sm:py-2 sm:text-sm ${on ? "border-espresso bg-espresso text-paper" : "border-line bg-paper text-ink hover:border-wood"}`}
                >
                  {x.rotulo}
                  <span className={`font-semibold sm:font-normal ${on ? "text-rattan" : "text-ink-soft"}`}>{conta(x.id)}</span>
                </Link>
              );
            })}
          </div>

          {visiveis.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-paper px-5 py-8 text-center text-sm text-ink-soft">
              {pedidos.length === 0 ? "Ninguém começou um pagamento pelo site ainda." : "Nenhum pedido aqui."}
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {visiveis.map((p) => {
                const st = situacao(p, agora);
                const emails = emailsEnviados(p);
                return (
                  <li key={p.ref} className="flex flex-col rounded-2xl border border-line/70 bg-paper shadow-[0_1px_2px_rgba(36,31,26,0.05)]">
                    <Link href={`/admin/clientes/${p.ref}`} className="flex items-start gap-3 rounded-t-2xl p-4 transition hover:bg-canvas/60 active:bg-canvas">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-espresso font-serif text-lg font-semibold text-rattan">
                        {p.nome.trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-semibold text-ink">{p.nome}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.c}`}>{st.t}</span>
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-soft">
                          {[p.cidade, telefone(p.whatsapp), quando(p.em), p.origem === "painel" ? "lançada por você" : ""].filter(Boolean).join(", ")}
                        </span>
                        <span className="mt-2 block text-sm text-ink">{p.itens.join(", ")}</span>
                        <span className="mt-1 block text-sm">
                          <span className="font-semibold text-ink">{formatBRL(p.valor)}</span> <span className="text-ink-soft">{noPagamento(p.forma)}</span>
                        </span>
                        {emails.length ? <span className="mt-1 block text-xs text-ink-soft">E-mails enviados: {emails.join(", ")}</span> : null}
                      </span>
                      <span aria-hidden className="self-center text-xl text-line">›</span>
                    </Link>
                    <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-line/60 px-3 py-2.5">
                      <a
                        href={whatsappUrl(p.whatsapp, mensagem(p))}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-verde px-3.5 py-1.5 text-sm font-semibold text-paper hover:bg-verde-escuro"
                      >
                        WhatsApp
                      </a>
                      {p.status === "pago" && site.googleUrl ? (
                        <a
                          href={whatsappUrl(p.whatsapp, pedidoDeAvaliacao(p.nome, site.googleUrl))}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full px-3 py-1.5 text-sm font-medium text-verde-escuro hover:bg-verde/10"
                        >
                          Pedir avaliação
                        </a>
                      ) : null}
                      {p.vid ? (
                        <Link href={`/admin/acessos/visitas?id=${p.vid}`} className="rounded-full px-3 py-1.5 text-sm font-medium text-wood-dark hover:bg-rattan/10">
                          Visita no site
                        </Link>
                      ) : null}
                      <span className="ml-auto">
                        <BotaoExcluir action={excluirPedidoAction.bind(null, p.ref)} rotulo="Apagar" pergunta={`Apagar o pedido de ${primeiroNome(p.nome)} desta lista?`} />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {aba === "avaliacao" && site.googleUrl ? (
        <Card
          titulo="Pedir avaliação no Google"
          descricao="Avaliações fazem o ateliê aparecer mais no Google Maps. Depois de entregar, mande esta mensagem para o cliente no WhatsApp (troque o nome). Cada pedido pago também tem o botão Pedir avaliação."
          acao={<CopiarNumeros numeros={[]} texto={pedidoDeAvaliacao("Cliente", site.googleUrl)} rotulo="Copiar mensagem" />}
        >
          <p className="rounded-xl bg-canvas px-4 py-3 text-sm text-ink">{pedidoDeAvaliacao("Cliente", site.googleUrl)}</p>
        </Card>
      ) : null}

      {aba === "lista" ? (
        <Card
          titulo="Lista de novidades"
          descricao="Quem se cadastrou no rodapé do site para receber novidades e cupons no WhatsApp. Se alguém pedir para sair, apague aqui."
          acao={lista.length ? <CopiarNumeros numeros={lista.map((i) => i.whatsapp)} /> : null}
        >
          {lista.length === 0 ? (
            <p className="text-sm text-ink-soft">Ninguém se cadastrou ainda. A caixinha fica no rodapé de todas as páginas do site.</p>
          ) : (
            <>
              <EscolherCupom cupons={cupons} />
              <ul className="divide-y divide-line/60">
                {lista.map((i) => (
                  <LinhaInteressado
                    key={i.id}
                    nome={i.nome}
                    whatsapp={i.whatsapp}
                    desde={quando(i.em)}
                    cupons={cupons}
                    editar={editarInteressadoAction.bind(null, i.id)}
                    excluir={excluirInteressadoAction.bind(null, i.id)}
                  />
                ))}
              </ul>
            </>
          )}
        </Card>
      ) : null}
    </div>
  );
}
