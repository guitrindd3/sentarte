import Link from "next/link";
import { lerOrcamento } from "@/lib/orcamentos";
import { precoCadeira } from "@/lib/offer";
import { redisAtivo } from "@/lib/redis";
import { Card } from "../../../_ui";
import { FormVenda, type InicialVenda, type ItemVenda } from "./form-venda";

// "Lançar venda" (2026-10-24): the atelier types a sale paid on WhatsApp —
// usually from an /eventos quote (?orcamento=<id> prefills it).

const preco = (n: number) => n.toFixed(2).replace(".", ",");

export default async function NovaVenda({ searchParams }: PageProps<"/admin/vendas/nova">) {
  if (!redisAtivo()) {
    return <Card titulo="Lançar venda"><p className="text-sm text-ink-soft">O banco do painel não está ligado.</p></Card>;
  }
  const { orcamento } = await searchParams;
  const o = typeof orcamento === "string" ? await lerOrcamento(orcamento).catch(() => null) : null;

  const itens: ItemVenda[] = o
    ? (
        [
          ["normal", "Cadeira normal"],
          ["infantil", "Cadeira infantil"],
          ["reclinavel", "Cadeira reclinável"],
        ] as const
      ).flatMap(([tipo, rotulo]) =>
        o.qtd[tipo] ? [{ descricao: `${rotulo} personalizada (${o.tipo})`, qtd: o.qtd[tipo], preco: preco(precoCadeira(true, tipo)), tipo }] : []
      )
    : [];
  const inicial: InicialVenda = {
    orcamento: o?.id,
    codigoOrcamento: o?.codigo,
    nome: o?.contato ?? "",
    whatsapp: o?.whatsapp ? o.whatsapp.slice(2) : "",
    cidade: o?.cidade ?? "",
    itens,
    obs: o ? [o.nomeEvento && `Nome: ${o.nomeEvento}`, o.cores && `Cores: ${o.cores}`, o.nomes && `Nomes nas cadeiras: ${o.nomes}`, o.ideia].filter(Boolean).join("\n") : "",
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={o ? "/admin/orcamentos" : "/admin/clientes"} className="text-sm font-medium text-wood-dark hover:underline">
          ‹ {o ? "Orçamentos" : "Clientes"}
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Lançar venda</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Para vendas fechadas no WhatsApp. Ela aparece em Clientes como paga, conta nas vagas da semana e o cliente acompanha pelo site, igual a uma compra feita no site.
          {o ? " Os valores vieram preenchidos com o preço do site: ajuste para o que foi combinado." : ""}
        </p>
      </div>
      <FormVenda inicial={inicial} />
    </div>
  );
}
