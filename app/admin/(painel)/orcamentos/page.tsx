import Link from "next/link";
import { orcamentosRecentes, type Orcamento, type StatusOrcamento } from "@/lib/orcamentos";
import { codigoDoPedido } from "@/lib/pedido";
import { redisAtivo } from "@/lib/redis";
import { whatsappUrl } from "@/lib/urls";
import { excluirOrcamentoAction, statusOrcamentoAction } from "../../actions";
import { AdminForm, BotaoExcluir, Card } from "../../_ui";

// Quote requests from /eventos (2026-10-24): what the customer asked for and
// the logo/pictures they attached. The atelier sketches the chair, sends it on
// WhatsApp, gets paid there and then "Gerar venda" types the sale in.
// 2026-11-14: same look as Clientes — status chips (?f=) with counts, compact
// cards with the actions in a bottom row.

const quando = (t: number) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(t));

function telefone(n: string) {
  const m = n.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : n;
}

const SITUACAO = {
  novo: { t: "Novo", c: "bg-clay text-paper" },
  respondido: { t: "Esboço enviado", c: "bg-rattan/25 text-wood-dark" },
  vendido: { t: "Vendido", c: "bg-verde text-paper" },
} as const;

type Filtro = StatusOrcamento | "todos";
const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: "novo", rotulo: "Novos" },
  { id: "respondido", rotulo: "Esboço enviado" },
  { id: "vendido", rotulo: "Vendidos" },
  { id: "todos", rotulo: "Todos" },
];

const statusDe = (o: Orcamento): StatusOrcamento => (o.status in SITUACAO ? o.status : "novo");

function linhas(o: Orcamento) {
  const q = o.qtd;
  const total = q.normal + q.infantil + q.reclinavel;
  const partes = [q.normal && `${q.normal} normais`, q.infantil && `${q.infantil} infantis`, q.reclinavel && `${q.reclinavel} reclináveis`].filter(Boolean);
  return [
    ["Para", `${o.tipo}${o.nomeEvento ? ` (${o.nomeEvento})` : ""}`],
    ["Cadeiras", `${total}${partes.length ? `: ${partes.join(", ")}` : ""}`],
    ["Data", o.data ? o.data.split("-").reverse().join("/") : ""],
    ["Cidade", o.cidade ?? ""],
    ["Nomes", o.nomes ?? ""],
    ["Cores", o.cores ?? ""],
  ].filter(([, v]) => v) as [string, string][];
}

export default async function Orcamentos({ searchParams }: PageProps<"/admin/orcamentos">) {
  const { f: filtroParam } = await searchParams;
  if (!redisAtivo()) {
    return <Card titulo="Orçamentos"><p className="text-sm text-ink-soft">O banco do painel não está ligado.</p></Card>;
  }
  let lista: Orcamento[] = [];
  try {
    lista = await orcamentosRecentes();
  } catch (err) {
    console.error("orcamentos", err);
  }
  const conta = (id: Filtro) => (id === "todos" ? lista.length : lista.filter((o) => statusDe(o) === id).length);
  const filtro: Filtro = FILTROS.find((x) => x.id === filtroParam)?.id ?? (conta("novo") ? "novo" : "todos");
  const visiveis = filtro === "todos" ? lista : lista.filter((o) => statusDe(o) === filtro);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Orçamentos</h1>
          <p className="mt-1.5 max-w-prose text-sm text-ink-soft sm:text-base">
            Pedidos da página Eventos, com a logo ou as imagens do cliente. Faça o esboço, mande no WhatsApp e, quando ele pagar, toque em &ldquo;Gerar venda&rdquo;.
          </p>
        </div>
        <Link href="/admin/vendas/nova" className="inline-flex items-center gap-1.5 rounded-full bg-espresso px-4 py-2.5 text-sm font-semibold text-paper hover:bg-espresso-soft">
          <span className="text-rattan">+</span> Lançar venda sem orçamento
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2" aria-label="Situação">
        {FILTROS.map((x) => {
          const on = filtro === x.id;
          return (
            <Link
              key={x.id}
              href={`/admin/orcamentos?f=${x.id}`}
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
          {lista.length === 0 ? "Ninguém pediu orçamento pelo site ainda. O formulário fica no fim da página /eventos." : "Nenhum orçamento aqui."}
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {visiveis.map((o) => {
            const s = SITUACAO[statusDe(o)];
            const primeiro = o.contato.split(" ")[0];
            return (
              <li key={o.id} className="flex min-w-0 flex-col rounded-2xl border border-line/70 bg-paper shadow-[0_1px_2px_rgba(36,31,26,0.05)]">
                <div className="flex items-start gap-3 p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-espresso font-serif text-lg font-semibold text-rattan">
                    {o.contato.trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold text-ink">{o.contato}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.c}`}>{s.t}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      <span className="font-mono font-semibold text-wood-dark">{o.codigo}</span>
                      {`, ${o.whatsapp ? `${telefone(o.whatsapp)}, ` : ""}${quando(o.em)}`}
                    </p>

                    <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                      {linhas(o).map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="text-ink-soft">{k}</dt>
                          <dd className="min-w-0 break-words text-ink">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    {o.ideia ? <p className="mt-2.5 whitespace-pre-line break-words rounded-xl bg-canvas px-3 py-2 text-sm text-ink">{o.ideia}</p> : null}

                    {o.fotos ? (
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        {Array.from({ length: o.fotos }, (_, n) => (
                          <div key={n} className="text-center">
                            <a href={`/admin/orcamento-foto/${o.id}/${n}`} target="_blank" rel="noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element -- private picture served by an admin route */}
                              <img
                                src={`/admin/orcamento-foto/${o.id}/${n}`}
                                alt={`Imagem ${n + 1} de ${o.contato}`}
                                className="h-24 w-24 rounded-xl border border-line bg-white object-contain sm:h-28 sm:w-28"
                              />
                            </a>
                            <a href={`/admin/orcamento-foto/${o.id}/${n}?baixar=1`} className="mt-1 inline-block text-xs font-medium text-wood-dark underline">
                              Baixar
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-line/60 px-3 py-2.5">
                  {statusDe(o) === "vendido" && o.pedido ? (
                    <Link href={`/admin/clientes/${o.pedido}`} className="inline-flex items-center rounded-full bg-espresso px-3.5 py-1.5 text-sm font-semibold text-paper hover:bg-espresso-soft">
                      Abrir a venda {codigoDoPedido(o.pedido)}
                    </Link>
                  ) : (
                    <Link href={`/admin/vendas/nova?orcamento=${o.id}`} className="inline-flex items-center rounded-full bg-espresso px-3.5 py-1.5 text-sm font-semibold text-paper hover:bg-espresso-soft">
                      Gerar venda
                    </Link>
                  )}
                  {o.whatsapp ? (
                    <a
                      href={whatsappUrl(o.whatsapp, `Oi, ${primeiro}! Aqui é do Ateliê SentArte, sobre o seu pedido de orçamento ${o.codigo}. Segue o esboço da cadeira:`)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-verde px-3.5 py-1.5 text-sm font-semibold text-paper hover:bg-verde-escuro"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                  {o.status === "novo" ? (
                    <AdminForm action={statusOrcamentoAction.bind(null, o.id, "respondido")}>
                      <button type="submit" className="rounded-full px-3 py-1.5 text-sm font-medium text-wood-dark hover:bg-rattan/10">
                        Já mandei o esboço
                      </button>
                    </AdminForm>
                  ) : o.status === "respondido" ? (
                    <AdminForm action={statusOrcamentoAction.bind(null, o.id, "novo")}>
                      <button type="submit" className="rounded-full px-3 py-1.5 text-sm font-medium text-wood-dark hover:bg-rattan/10">
                        Voltar para novo
                      </button>
                    </AdminForm>
                  ) : null}
                  <span className="ml-auto">
                    <BotaoExcluir action={excluirOrcamentoAction.bind(null, o.id)} rotulo="Apagar" pergunta={`Apagar o orçamento de ${primeiro} e as imagens?`} />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
