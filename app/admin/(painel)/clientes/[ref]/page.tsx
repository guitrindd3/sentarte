import Link from "next/link";
import { notFound } from "next/navigation";
import { lerPedido, type PedidoCliente } from "@/lib/clientes";
import { getAdminContent } from "@/lib/content-store";
import { lerRemetente, remetenteCompleto } from "@/lib/melhor-envio";
import { SITE_URL } from "@/lib/nav";
import { formatBRL } from "@/lib/offer";
import { codigoDoPedido } from "@/lib/pedido";
import { linkRastreio } from "@/lib/rastreio";
import { redisAtivo } from "@/lib/redis";
import { whatsappUrl } from "@/lib/urls";
import { definirEtapaAction, salvarRastreioAction } from "../../../actions";
import { AdminForm, btnSecondary, Card, Field, inputClass, SaveButton } from "../../../_ui";
import { CopiarNumeros } from "../copiar";
import { Etiqueta } from "./etiqueta";

// One order (2026-10-06): delivery data, the steps the customer sees on
// /acompanhar, and the Melhor Envio label.

const quando = (t?: number) =>
  t ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(t)) : "";

function telefone(n: string) {
  const m = n.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "").match(/^(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : n;
}
const cpfFmt = (c: string) => c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

function enderecoTexto(p: PedidoCliente) {
  const e = p.entrega;
  if (!e) return "";
  return [e.nome, `${e.endereco}, ${e.numero}${e.complemento ? ` - ${e.complemento}` : ""}`, `${e.bairro ? `${e.bairro} - ` : ""}${e.cidade}/${e.uf}`, `CEP ${e.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}`].join("\n");
}

function mensagemAoCliente(p: PedidoCliente) {
  const nome = p.nome.trim().split(/\s+/)[0];
  const link = `${SITE_URL}/acompanhar/${p.ref}`;
  if (p.etapa === "enviado") {
    return `Oi, ${nome}! Aqui é do Ateliê SentArte. Sua cadeira já foi enviada! 🚚${p.rastreio ? `\nCódigo de rastreio: ${p.rastreio}` : ""}\nAcompanhe aqui: ${link}`;
  }
  if (p.etapa === "entregue") return `Oi, ${nome}! Aqui é do Ateliê SentArte. Vi que sua cadeira chegou. Espero que goste! Qualquer coisa é só chamar.`;
  return `Oi, ${nome}! Aqui é do Ateliê SentArte. Recebemos o seu pedido ${codigoDoPedido(p.ref)} e já estamos trançando a sua cadeira. Você acompanha tudo por aqui: ${link}`;
}

const ETAPAS = [
  { v: "producao", t: "Em produção" },
  { v: "enviado", t: "Enviado" },
  { v: "entregue", t: "Entregue" },
] as const;

export default async function PedidoAdmin({ params }: PageProps<"/admin/clientes/[ref]">) {
  const { ref } = await params;
  if (!redisAtivo()) notFound();
  const p = await lerPedido(ref);
  if (!p) notFound();
  const { site } = await getAdminContent();
  const remetenteOk = remetenteCompleto(await lerRemetente());
  const pago = p.status === "pago";
  const etapa = p.etapa ?? (pago ? "producao" : undefined);
  const e = p.entrega;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/clientes" className="text-sm font-medium text-wood-dark hover:underline">
          ‹ Clientes
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          Pedido {codigoDoPedido(p.ref)}
        </h1>
        <p className="mt-1 text-ink-soft">
          {p.nome}, {quando(p.em)}.{" "}
          <strong className={pago ? "text-verde-escuro" : "text-clay-dark"}>
            {pago ? `Pago em ${quando(p.pagoEm)}` : p.status === "recusado" ? "Pagamento recusado" : p.status === "pendente" ? "Pagamento pendente" : "Não pago"}
          </strong>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card titulo="O que foi pedido">
          <ul className="space-y-1 text-ink">
            {p.itens.map((i, k) => (
              <li key={k}>{i}</li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-line/70 pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">Total pago</dt>
              <dd className="font-semibold text-ink">
                {formatBRL(p.valor)} no {p.forma === "pix" ? "Pix" : "cartão"}
              </dd>
            </div>
            {p.frete ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Frete cobrado</dt>
                <dd className="text-ink">
                  {p.frete.valor ? formatBRL(p.frete.valor) : "grátis"}
                  {p.frete.servico ? ` (${p.frete.servico})` : ""}
                </dd>
              </div>
            ) : null}
            {p.cupom ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Cupom</dt>
                <dd className="text-ink">{p.cupom}</dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <Card titulo="Entregar para" acao={e ? <CopiarNumeros numeros={[]} texto={enderecoTexto(p)} rotulo="Copiar endereço" /> : null}>
          {e ? (
            <div className="space-y-1 text-ink">
              <p className="whitespace-pre-line">{enderecoTexto(p)}</p>
              <p className="pt-2 text-sm text-ink-soft">
                WhatsApp {telefone(e.telefone)}
                {e.email ? `, ${e.email}` : ""}
                {e.cpf ? `, CPF ${cpfFmt(e.cpf)}` : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">
              Pedido de antes de 06/10: só tem a cidade ({p.cidade}). Peça o endereço completo no WhatsApp.
            </p>
          )}
          <a
            href={whatsappUrl(p.whatsapp, mensagemAoCliente(p))}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-verde px-4 py-2 text-sm font-semibold text-paper hover:bg-verde-escuro"
          >
            Mandar andamento no WhatsApp
          </a>
        </Card>
      </div>

      <Card
        titulo="Andamento"
        descricao={
          <>
            É o que o cliente vê em{" "}
            <a href={`/acompanhar/${p.ref}`} target="_blank" rel="noreferrer" className="font-medium text-wood-dark underline">
              Acompanhar pedido
            </a>
            . Marque cada etapa quando acontecer.
          </>
        }
      >
        {pago ? (
          <div className="flex flex-wrap gap-2">
            {ETAPAS.map((s) => (
              <AdminForm key={s.v} action={definirEtapaAction.bind(null, p.ref, s.v)}>
                <button
                  type="submit"
                  className={
                    etapa === s.v
                      ? "inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
                      : btnSecondary
                  }
                >
                  {etapa === s.v ? "✓ " : ""}
                  {s.t}
                  {p.etapaEm?.[s.v] ? <span className="font-normal opacity-70">{quando(p.etapaEm[s.v]).slice(0, 5)}</span> : null}
                </button>
              </AdminForm>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">As etapas aparecem quando o pagamento for aprovado.</p>
        )}

        <AdminForm action={salvarRastreioAction.bind(null, p.ref)} className="mt-6 grid gap-4 border-t border-line/70 pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Código de rastreio" dica="Preenche sozinho com a etiqueta do Melhor Envio.">
            <input name="rastreio" defaultValue={p.rastreio ?? ""} className={`${inputClass} font-mono uppercase`} placeholder="Ex.: AA123456789BR" />
          </Field>
          <Field label="Transportadora">
            <input name="transportadora" defaultValue={p.transportadora ?? ""} className={inputClass} placeholder="Ex.: Correios" />
          </Field>
          <SaveButton>Salvar rastreio</SaveButton>
        </AdminForm>
        {p.rastreio ? (
          <p className="mt-3 text-sm">
            <a href={linkRastreio(p.rastreio.split(",")[0])} target="_blank" rel="noreferrer" className="font-medium text-wood-dark underline">
              Ver onde está a encomenda
            </a>
          </p>
        ) : null}
      </Card>

      {pago ? (
        <Card
          titulo="Etiqueta de envio (Melhor Envio)"
          descricao="Uma etiqueta por cadeira. Escolha a transportadora, coloque no carrinho do Melhor Envio e pague com o saldo de lá (ou finalize no site do Melhor Envio)."
        >
          {!remetenteOk ? (
            <p className="rounded-xl bg-rattan/10 px-4 py-3 text-sm text-wood-dark">
              Antes da primeira etiqueta, preencha os dados de quem envia em{" "}
              <Link href="/admin/avisos" className="font-semibold underline">
                Avisos e envio
              </Link>
              .
            </p>
          ) : !e?.cpf ? (
            <p className="text-sm text-ink-soft">Esse pedido não tem CPF e endereço completo guardados (é de antes de 06/10). Faça a etiqueta direto no site do Melhor Envio.</p>
          ) : (
            <Etiqueta refPedido={p.ref} envios={p.envios ?? []} etiquetaUrl={p.etiquetaUrl} freteCobrado={p.frete?.valor} />
          )}
        </Card>
      ) : null}

      {site.googleUrl && etapa === "entregue" ? (
        <p className="text-sm text-ink-soft">
          Entregue! Que tal{" "}
          <a
            href={whatsappUrl(p.whatsapp, `Oi, ${p.nome.split(" ")[0]}! Aqui é do Ateliê SentArte. Espero que esteja curtindo a sua cadeira! Se puder, deixa uma avaliação pra gente no Google? Ajuda muito o ateliê: ${site.googleUrl}`)}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-wood-dark underline"
          >
            pedir uma avaliação no Google
          </a>
          ?
        </p>
      ) : null}
    </div>
  );
}
