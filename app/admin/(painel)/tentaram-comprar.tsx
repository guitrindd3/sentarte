import Link from "next/link";
import type { PedidoCliente, Recusa } from "@/lib/clientes";
import { formatBRL } from "@/lib/offer";
import { detalhePrincipal, motivoParaOAtelie } from "@/lib/recusa-cartao";
import { whatsappUrl } from "@/lib/urls";

// Admin home (2026-11-09): who tried to buy this week and didn't manage —
// card refused (with Mercado Pago's reason) or went to pay and never
// finished — with a ready WhatsApp message to close the sale.

export type Tentativa = { p: PedidoCliente; recusas: Recusa[] };

const SEMANA = 7 * 86400000;
const so = (t: string) => t.replace(/\D/g, "");

/** Refused or unfinished orders of the last 7 days, newest first, one per person, minus people who paid afterwards. */
export function tentativasDaSemana(pedidos: PedidoCliente[], agora: number): PedidoCliente[] {
  const pagaram = pedidos.filter((p) => p.status === "pago" || p.status === "pendente");
  const vistos = new Set<string>();
  return pedidos
    .filter((p) => agora - p.em < SEMANA && (p.status === "recusado" || (p.status === "aguardando" && agora - p.em > 30 * 60000)))
    .sort((a, b) => b.em - a.em)
    .filter((p) => {
      const quem = so(p.whatsapp) || p.ref;
      if (vistos.has(quem)) return false;
      vistos.add(quem);
      return !pagaram.some((x) => x.em >= p.em && so(x.whatsapp) === so(p.whatsapp));
    });
}

const primeiroNome = (n: string) => n.trim().split(/\s+/)[0] ?? n;

function quando(ms: number, agora: number) {
  const min = Math.round((agora - ms) / 60000);
  if (min < 60) return `há ${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(ms));
}

function mensagem(p: PedidoCliente, recusado: boolean) {
  const itens = p.itens.join(", ");
  return recusado
    ? `Oi, ${primeiroNome(p.nome)}! Aqui é do Ateliê SentArte. Vi que você tentou comprar no site (${itens}) e o pagamento no cartão não passou. Posso te ajudar? Se preferir, te mando o Pix, que é na hora.`
    : `Oi, ${primeiroNome(p.nome)}! Aqui é do Ateliê SentArte. Vi que você começou um pedido no site (${itens}) e o pagamento não foi concluído. Posso te ajudar com alguma coisa?`;
}

export function TentaramComprar({ lista, agora }: { lista: Tentativa[]; agora: number }) {
  if (!lista.length) return null;
  return (
    <section className="overflow-hidden rounded-3xl border-2 border-clay/40 bg-paper">
      <div className="bg-[#fbeee8] px-5 py-4 sm:px-6">
        <h2 className="font-serif text-xl font-medium tracking-tight text-clay-dark sm:text-2xl">
          {lista.length} {lista.length === 1 ? "pessoa tentou comprar e não conseguiu" : "pessoas tentaram comprar e não conseguiram"}
        </h2>
        <p className="mt-0.5 text-sm text-ink">Últimos 7 dias. Chame no WhatsApp enquanto a vontade ainda está quente: a mensagem já vai pronta.</p>
      </div>
      <ul className="divide-y divide-line/70">
        {lista.map(({ p, recusas }) => {
          const recusado = p.status === "recusado";
          const { motivo, dica } = recusado
            ? motivoParaOAtelie(detalhePrincipal(recusas))
            : { motivo: "Foi pagar e não terminou", dica: p.forma === "pix" ? "Gerou o Pix e não pagou: mande o Pix de novo." : "Ofereça ajuda ou o Pix." };
          const vezes = recusas.length;
          return (
            <li key={p.ref} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold text-ink">{p.nome}</span>
                  <span className="text-xs text-ink-soft">
                    {[p.cidade || p.entrega?.cidade, quando(p.em, agora)].filter(Boolean).join(" · ")}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-ink">
                  {p.itens.join(", ")} · <strong className="font-semibold">{formatBRL(p.valor)}</strong>
                  {p.cupom ? <span className="text-ink-soft"> · cupom {p.cupom}</span> : null}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-clay/15 px-2.5 py-0.5 text-xs font-semibold text-clay-dark">
                    {recusado ? `Cartão recusado${vezes > 1 ? ` ${vezes}x` : ""}` : p.forma === "pix" ? "Pix não pago" : "Não terminou"}
                  </span>
                  <span className="font-medium text-ink">{motivo}</span>
                </p>
                <p className="mt-1 text-xs text-ink-soft">{dica}</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
                {p.whatsapp ? (
                  <a
                    href={whatsappUrl(p.whatsapp, mensagem(p, recusado))}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-verde px-4 py-2 text-center text-sm font-semibold text-paper transition hover:bg-verde-escuro"
                  >
                    Chamar no WhatsApp
                  </a>
                ) : null}
                <Link href={`/admin/clientes/${p.ref}`} className="rounded-full border border-line px-4 py-2 text-center text-sm font-medium text-ink hover:border-wood">
                  Ver pedido
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
