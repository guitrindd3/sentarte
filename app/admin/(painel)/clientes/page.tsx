import Link from "next/link";
import { atualizarComMercadoPago, listarInteressados, pedidosRecentes, type Interessado, type PedidoCliente } from "@/lib/clientes";
import { getAdminContent } from "@/lib/content-store";
import { formatBRL } from "@/lib/offer";
import { redisAtivo } from "@/lib/redis";
import { whatsappUrl } from "@/lib/urls";
import { excluirInteressadoAction, excluirPedidoAction } from "../../actions";
import { BotaoExcluir, Card } from "../../_ui";
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

export default async function Clientes() {
  if (!redisAtivo()) {
    return <Card titulo="Clientes"><p className="text-sm text-ink-soft">O banco do painel não está ligado.</p></Card>;
  }
  let pedidos: PedidoCliente[] = [];
  let lista: Interessado[] = [];
  try {
    [pedidos, lista] = await Promise.all([pedidosRecentes().then(atualizarComMercadoPago), listarInteressados()]);
  } catch (err) {
    console.error("clientes", err);
  }
  const { agora } = referencias();
  const { site } = await getAdminContent();
  const naoTerminou = pedidos.filter((p) => situacao(p, agora).t === "Não terminou").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Clientes</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Quem se identificou no site: pedidos começados no &ldquo;Pagar agora&rdquo; e quem pediu para receber novidades.
        </p>
      </div>

      <Card
        titulo="Pedidos começados no site"
        descricao={
          naoTerminou
            ? `${naoTerminou} ${naoTerminou === 1 ? "pessoa foi pagar e não terminou" : "pessoas foram pagar e não terminaram"}. Vale chamar no WhatsApp!`
            : "Quem clicou em pagar. O status é conferido no Mercado Pago."
        }
      >
        {pedidos.length === 0 ? (
          <p className="text-sm text-ink-soft">Ninguém começou um pagamento pelo site ainda.</p>
        ) : (
          <ul className="space-y-3">
            {pedidos.map((p) => {
              const s = situacao(p, agora);
              return (
                <li key={p.ref} className="rounded-xl border border-line/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/admin/clientes/${p.ref}`} className="font-semibold text-ink underline-offset-2 hover:underline">
                        {p.nome} <span className="font-normal text-ink-soft">({p.cidade})</span>
                      </Link>
                      <p className="text-sm text-ink-soft">
                        {telefone(p.whatsapp)}, {quando(p.em)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.c}`}>{s.t}</span>
                  </div>
                  <ul className="mt-3 space-y-0.5 text-sm text-ink">
                    {p.itens.map((i, k) => (
                      <li key={k}>{i}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm text-ink-soft">
                    {formatBRL(p.valor)} no {p.forma === "pix" ? "Pix" : "cartão"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {p.status === "pago" ? (
                      <Link href={`/admin/clientes/${p.ref}`} className="inline-flex items-center gap-2 rounded-full bg-wood px-4 py-2 text-sm font-semibold text-paper hover:bg-wood-dark">
                        Abrir pedido (entrega e etiqueta)
                      </Link>
                    ) : null}
                    <a
                      href={whatsappUrl(p.whatsapp, mensagem(p))}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-verde px-4 py-2 text-sm font-semibold text-paper hover:bg-verde-escuro"
                    >
                      Chamar no WhatsApp
                    </a>
                    {p.status === "pago" && site.googleUrl ? (
                      <a
                        href={whatsappUrl(p.whatsapp, pedidoDeAvaliacao(p.nome, site.googleUrl))}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-verde px-4 py-2 text-sm font-semibold text-verde-escuro hover:bg-verde/5"
                      >
                        Pedir avaliação
                      </a>
                    ) : null}
                    {p.vid ? (
                      <Link href={`/admin/acessos/visitas?id=${p.vid}`} className="rounded-full px-3 py-2 text-sm font-medium text-wood-dark hover:bg-rattan/10">
                        Ver o que fez no site
                      </Link>
                    ) : null}
                    <BotaoExcluir action={excluirPedidoAction.bind(null, p.ref)} rotulo="Apagar" pergunta={`Apagar o pedido de ${primeiroNome(p.nome)} desta lista?`} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {site.googleUrl ? (
        <Card
          titulo="Pedir avaliação no Google"
          descricao="Avaliações fazem o ateliê aparecer mais no Google Maps. Depois de entregar, mande esta mensagem para o cliente no WhatsApp (troque o nome)."
          acao={<CopiarNumeros numeros={[]} texto={pedidoDeAvaliacao("Cliente", site.googleUrl)} rotulo="Copiar mensagem" />}
        >
          <p className="rounded-xl bg-canvas px-4 py-3 text-sm text-ink">{pedidoDeAvaliacao("Cliente", site.googleUrl)}</p>
        </Card>
      ) : null}

      <Card
        titulo="Lista de novidades"
        descricao="Quem se cadastrou no rodapé do site para receber novidades e cupons no WhatsApp. Se alguém pedir para sair, apague aqui."
        acao={lista.length ? <CopiarNumeros numeros={lista.map((i) => i.whatsapp)} /> : null}
      >
        {lista.length === 0 ? (
          <p className="text-sm text-ink-soft">Ninguém se cadastrou ainda. A caixinha fica no rodapé de todas as páginas do site.</p>
        ) : (
          <ul className="divide-y divide-line/60">
            {lista.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{i.nome}</p>
                  <p className="text-sm text-ink-soft">
                    {telefone(i.whatsapp)}, desde {quando(i.em)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={whatsappUrl(i.whatsapp, `Oi, ${primeiroNome(i.nome)}! Aqui é do Ateliê SentArte. `)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-verde px-3 py-1.5 text-sm font-semibold text-verde-escuro hover:bg-verde/5"
                  >
                    Chamar
                  </a>
                  <BotaoExcluir action={excluirInteressadoAction.bind(null, i.id)} rotulo="Tirar" pergunta={`Tirar ${primeiroNome(i.nome)} da lista?`} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
