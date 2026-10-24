import Link from "next/link";
import { orcamentosRecentes, type Orcamento } from "@/lib/orcamentos";
import { codigoDoPedido } from "@/lib/pedido";
import { redisAtivo } from "@/lib/redis";
import { whatsappUrl } from "@/lib/urls";
import { excluirOrcamentoAction, statusOrcamentoAction } from "../../actions";
import { AdminForm, BotaoExcluir, btnPrimary, btnSecondary, Card } from "../../_ui";

// Quote requests from /eventos (2026-10-24): what the customer asked for and
// the logo/pictures they attached. The atelier sketches the chair, sends it on
// WhatsApp, gets paid there and then "Gerar venda" types the sale in.

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

export default async function Orcamentos() {
  if (!redisAtivo()) {
    return <Card titulo="Orçamentos"><p className="text-sm text-ink-soft">O banco do painel não está ligado.</p></Card>;
  }
  let lista: Orcamento[] = [];
  try {
    lista = await orcamentosRecentes();
  } catch (err) {
    console.error("orcamentos", err);
  }
  const novos = lista.filter((o) => o.status === "novo").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Orçamentos</h1>
          <p className="mt-2 max-w-prose text-ink-soft">
            Pedidos de orçamento da página Eventos, com a logo ou as imagens que o cliente mandou. Faça o esboço, mande no WhatsApp e, quando ele pagar, clique em
            &ldquo;Gerar venda&rdquo;.
          </p>
        </div>
        <Link href="/admin/vendas/nova" className={btnSecondary}>
          Lançar venda sem orçamento
        </Link>
      </div>

      <Card
        titulo={novos ? `${novos} ${novos === 1 ? "orçamento novo" : "orçamentos novos"}` : "Pedidos de orçamento"}
        descricao="O número (ex.: K7Q2) é o mesmo que chega na mensagem do WhatsApp. Ficam guardados por 6 meses."
      >
        {lista.length === 0 ? (
          <p className="text-sm text-ink-soft">Ninguém pediu orçamento pelo site ainda. O formulário fica no fim da página /eventos.</p>
        ) : (
          <ul className="space-y-4">
            {lista.map((o) => {
              const s = SITUACAO[o.status] ?? SITUACAO.novo;
              const primeiro = o.contato.split(" ")[0];
              return (
                <li key={o.id} className="rounded-xl border border-line/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">
                        <span className="mr-2 font-mono text-wood-dark">{o.codigo}</span>
                        {o.contato}
                      </p>
                      <p className="text-sm text-ink-soft">
                        {o.whatsapp ? `${telefone(o.whatsapp)}, ` : ""}
                        {quando(o.em)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.c}`}>{s.t}</span>
                  </div>

                  <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                    {linhas(o).map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-ink-soft">{k}</dt>
                        <dd className="text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {o.ideia ? <p className="mt-3 whitespace-pre-line rounded-xl bg-canvas px-3 py-2 text-sm text-ink">{o.ideia}</p> : null}

                  {o.fotos ? (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {Array.from({ length: o.fotos }, (_, n) => (
                        <div key={n} className="text-center">
                          <a href={`/admin/orcamento-foto/${o.id}/${n}`} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element -- private picture served by an admin route */}
                            <img
                              src={`/admin/orcamento-foto/${o.id}/${n}`}
                              alt={`Imagem ${n + 1} de ${o.contato}`}
                              className="h-32 w-32 rounded-lg border border-line bg-white object-contain"
                            />
                          </a>
                          <a href={`/admin/orcamento-foto/${o.id}/${n}?baixar=1`} className="mt-1 inline-block text-xs font-medium text-wood-dark underline">
                            Baixar
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {o.status === "vendido" && o.pedido ? (
                      <Link href={`/admin/clientes/${o.pedido}`} className={btnPrimary}>
                        Abrir a venda {codigoDoPedido(o.pedido)}
                      </Link>
                    ) : (
                      <Link href={`/admin/vendas/nova?orcamento=${o.id}`} className={btnPrimary}>
                        Gerar venda
                      </Link>
                    )}
                    {o.whatsapp ? (
                      <a
                        href={whatsappUrl(o.whatsapp, `Oi, ${primeiro}! Aqui é do Ateliê SentArte, sobre o seu pedido de orçamento ${o.codigo}. Segue o esboço da cadeira:`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-verde px-4 py-2 text-sm font-semibold text-paper hover:bg-verde-escuro"
                      >
                        Chamar no WhatsApp
                      </a>
                    ) : null}
                    {o.status === "novo" ? (
                      <AdminForm action={statusOrcamentoAction.bind(null, o.id, "respondido")}>
                        <button type="submit" className={btnSecondary}>
                          Já mandei o esboço
                        </button>
                      </AdminForm>
                    ) : o.status === "respondido" ? (
                      <AdminForm action={statusOrcamentoAction.bind(null, o.id, "novo")}>
                        <button type="submit" className={btnSecondary}>
                          Voltar para novo
                        </button>
                      </AdminForm>
                    ) : null}
                    <BotaoExcluir action={excluirOrcamentoAction.bind(null, o.id)} rotulo="Apagar" pergunta={`Apagar o orçamento de ${primeiro} e as imagens?`} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
