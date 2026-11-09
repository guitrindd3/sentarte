import Link from "next/link";
import { notFound } from "next/navigation";
import { lerPedido, recusasDosPedidos, type PedidoCliente } from "@/lib/clientes";
import { detalhePrincipal, motivoParaOAtelie } from "@/lib/recusa-cartao";
import { getAdminContent } from "@/lib/content-store";
import { lerRemetente, remetenteCompleto } from "@/lib/melhor-envio";
import { SITE_URL } from "@/lib/nav";
import { formatBRL } from "@/lib/offer";
import { codigoDoPedido, noPagamento } from "@/lib/pedido";
import { linkRastreio } from "@/lib/rastreio";
import { redisAtivo } from "@/lib/redis";
import { whatsappUrl } from "@/lib/urls";
import { definirEtapaAction, editarPassaporteAction, gerarPassaportesAction, recebiPorForaAction, salvarRastreioAction } from "../../../actions";
import { codigoDoPassaporte, lerConfigPassaporte, lerPassaportes, numeroBonito, rotuloTipo } from "@/lib/passaporte";
import { AdminForm, btnSecondary, Card, Field, inputClass, SaveButton } from "../../../_ui";
import { CopiarNumeros } from "../copiar";
import { Etiqueta } from "./etiqueta";
import { FotosProducao } from "./fotos-producao";
import { fotosDaProducao, MAX_FOTOS_PRODUCAO } from "@/lib/fotos-producao";
import { lerOrcamento } from "@/lib/orcamentos";

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
  const fotos = await fotosDaProducao(p.ref).catch(() => []);
  const recusas = (await recusasDosPedidos([p.ref])).get(p.ref) ?? [];
  const passaportes = p.passaportes?.length ? await lerPassaportes(p.passaportes).catch(() => []) : [];
  const cfgPassaporte = await lerConfigPassaporte().catch(() => null);
  const orc = p.orcamento ? await lerOrcamento(p.orcamento).catch(() => null) : null;
  const primeiroNome = p.nome.trim().split(/\s+/)[0];
  const avisoFoto = `Oi, ${primeiroNome}! Aqui é do Ateliê SentArte. Sua cadeira já está sendo trançada 😍 Olha como ela está ficando: ${SITE_URL}/acompanhar/${p.ref}`;

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
            {pago ? `${p.origem === "painel" ? "Lançada no painel em" : "Pago em"} ${quando(p.pagoEm)}` : p.status === "recusado" ? "Pagamento recusado" : p.status === "pendente" ? "Pagamento pendente" : "Não pago"}
          </strong>
        </p>
      </div>

      {recusas.length && !pago ? (
        <div className="rounded-2xl border-2 border-clay/40 bg-[#fbeee8] px-5 py-4">
          <p className="font-semibold text-clay-dark">
            Cartão recusado {recusas.length === 1 ? "1 vez" : `${recusas.length} vezes`}: {motivoParaOAtelie(detalhePrincipal(recusas)).motivo}
          </p>
          <p className="mt-0.5 text-sm text-ink">{motivoParaOAtelie(detalhePrincipal(recusas)).dica}</p>
          {recusas.length > 1 ? (
            <ul className="mt-2 space-y-0.5 text-xs text-ink-soft">
              {recusas.map((r, i) => (
                <li key={i}>
                  {quando(r.em)}: {motivoParaOAtelie(r.detalhe).motivo}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {!pago ? (
        <Card
          titulo="Ela pagou por fora?"
          descricao="Se a cliente pagou pelo WhatsApp (Pix direto, dinheiro, transferência…), marque aqui. O pedido vira pago e entra em produção com tudo pronto: código do pedido, link para acompanhar, confirmação para a cliente, passaporte e etiqueta de envio. Depois é só colocar o código de rastreio dos Correios quando despachar."
        >
          <AdminForm action={recebiPorForaAction.bind(null, p.ref)} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="Como pagou">
              <select name="forma" defaultValue="pix" className={inputClass}>
                <option value="pix">Pix direto</option>
                <option value="transferencia">Transferência</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão (maquininha ou link)</option>
                <option value="outro">Outro</option>
              </select>
            </Field>
            <Field label="Valor recebido (R$)" dica={`No site estava ${formatBRL(p.valor)}.`}>
              <input name="valor" inputMode="decimal" required defaultValue={p.valor.toFixed(2).replace(".", ",")} className={inputClass} />
            </Field>
            <SaveButton>Marcar como pago</SaveButton>
          </AdminForm>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card titulo="O que foi pedido">
          <ul className="space-y-1 text-ink">
            {p.itens.map((i, k) => {
              // Monte a sua trama orders carry "— desenho: <site>/c?<design>" (2026-10-21): show the chair
              const [texto, link] = i.split(" — desenho: ");
              const q = link?.split("/c?")[1];
              return (
                <li key={k}>
                  {texto}
                  {q ? (
                    <a href={`/c?${q}`} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-3 text-sm text-ink underline underline-offset-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/cadeira?${q}`} alt="Desenho da cadeira" className="h-28 w-auto border border-line bg-canvas" />
                      Ver o desenho grande
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {p.codigosVale?.length ? (
            <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-sm text-ink">
              Vale-presente criado: {p.codigosVale.map((v) => <strong key={v.codigo} className="mr-2 font-mono">{v.codigo}</strong>)}
              <span className="block text-xs text-ink-soft">Aparece em Cupons. Vale uma vez, até {p.codigosVale[0].validoAte.split("-").reverse().join("/")}.</span>
            </p>
          ) : null}
          {p.valeUsado ? <p className="mt-2 text-sm text-ink-soft">Pagou parte com o vale-presente {p.valeUsado}.</p> : null}
          {p.obs ? <p className="mt-3 whitespace-pre-line rounded-xl bg-canvas px-3 py-2 text-sm text-ink">{p.obs}</p> : null}
          {orc?.fotos ? (
            <div className="mt-3">
              <p className="text-sm text-ink-soft">
                Imagens que o cliente mandou no{" "}
                <Link href="/admin/orcamentos" className="font-medium text-wood-dark underline">
                  orçamento {orc.codigo}
                </Link>
                :
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.from({ length: orc.fotos }, (_, n) => (
                  <a key={n} href={`/admin/orcamento-foto/${orc.id}/${n}`} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- private picture served by an admin route */}
                    <img src={`/admin/orcamento-foto/${orc.id}/${n}`} alt={`Imagem ${n + 1}`} className="h-24 w-24 rounded-lg border border-line bg-white object-contain" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
          <dl className="mt-4 space-y-1 border-t border-line/70 pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">{p.origem === "painel" ? "Total" : "Total pago"}</dt>
              <dd className="font-semibold text-ink">
                {formatBRL(p.valor)} {noPagamento(p.forma)}
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
              {e.presente ? (
                <p className="mt-2 border border-line bg-canvas px-3 py-2 text-sm text-ink">
                  <strong className="font-semibold">🎁 É presente.</strong>{" "}
                  {e.recado ? <>Recado para o cartão: &ldquo;{e.recado}&rdquo;</> : "Sem recado."}
                </p>
              ) : null}
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

      {pago ? (
        <Card titulo="Fotos da produção" descricao="Aparecem na página Acompanhar pedido do cliente, na hora. Até 6 por pedido.">
          <FotosProducao
            pedidoRef={p.ref}
            fotos={fotos.map((f) => ({ id: f.id, legenda: f.legenda, quando: quando(f.em) }))}
            max={MAX_FOTOS_PRODUCAO}
            linkWhatsapp={whatsappUrl(p.whatsapp, avisoFoto)}
          />
        </Card>
      ) : null}

      {pago && p.porTipo && p.porTipo.normal + p.porTipo.infantil + p.porTipo.reclinavel > 0 ? (
        <Card
          titulo="Passaporte da cadeira"
          descricao="Cada cadeira tem um número e uma página com a história dela. Imprima a etiqueta com o QR code e prenda na cadeira antes de enviar."
          acao={
            passaportes.length ? (
              <a href={`/admin/etiquetas?ref=${p.ref}`} target="_blank" rel="noreferrer" className={btnSecondary}>
                Imprimir {passaportes.length === 1 ? "a etiqueta" : `as ${passaportes.length} etiquetas`}
              </a>
            ) : null
          }
        >
          {passaportes.length ? (
            <ul className="space-y-4">
              {passaportes.map((x) => {
                const padrao = cfgPassaporte?.porTipo[x.tipo];
                return (
                  <li key={x.n} className="rounded-xl border border-line/70 bg-canvas p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-ink">
                        Cadeira nº {numeroBonito(x.n)}
                        {x.colecao ? (
                          <span className="ml-2 rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-paper">
                            {x.colecao.nome}: {String(x.colecao.numero).padStart(2, "0")} de {x.colecao.total}
                          </span>
                        ) : null}
                      </p>
                      <a href={`/p/${codigoDoPassaporte(x.n)}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-wood-dark underline">
                        Ver o passaporte
                      </a>
                    </div>
                    <AdminForm action={editarPassaporteAction.bind(null, x.n)} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Cadeira">
                        <input name="modelo" defaultValue={x.modelo} maxLength={80} className={inputClass} />
                      </Field>
                      <Field label="Nome trançado">
                        <input name="nome" defaultValue={x.nome ?? ""} maxLength={40} className={inputClass} placeholder="Sem nome" />
                      </Field>
                      <Field label="Quem trançou">
                        <input name="artesa" defaultValue={x.artesa ?? ""} maxLength={60} className={inputClass} placeholder={cfgPassaporte?.artesa || "Ateliê SentArte"} />
                      </Field>
                      <Field label="Horas de trabalho">
                        <input name="horas" inputMode="decimal" defaultValue={x.horas ?? ""} className={inputClass} placeholder={padrao?.horas ? `${padrao.horas} (padrão)` : "Ex.: 6"} />
                      </Field>
                      <Field label="Metros de fio">
                        <input name="metros" inputMode="decimal" defaultValue={x.metros ?? ""} className={inputClass} placeholder={padrao?.metros ? `${padrao.metros} (padrão)` : "Ex.: 180"} />
                      </Field>
                      <Field label="Ficou pronta em">
                        <input name="prontaEm" type="date" defaultValue={x.prontaEm ?? ""} className={inputClass} />
                      </Field>
                      <p className="text-xs text-ink-soft sm:col-span-2 lg:col-span-2">Tipo: {rotuloTipo(x.tipo)}{x.extras?.length ? `, ${x.extras.join(", ")}` : ""}. Em branco usa o padrão de <Link href="/admin/passaportes" className="underline">Passaportes</Link>.</p>
                      <SaveButton>Salvar passaporte</SaveButton>
                    </AdminForm>
                  </li>
                );
              })}
            </ul>
          ) : (
            <AdminForm action={gerarPassaportesAction.bind(null, p.ref)}>
              <p className="mb-3 text-sm text-ink-soft">Esse pedido ainda não tem passaporte (os pedidos pagos a partir de agora ganham sozinhos).</p>
              <SaveButton>Gerar passaportes</SaveButton>
            </AdminForm>
          )}
        </Card>
      ) : null}

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
          // choosing a step does nothing until "Salvar andamento" (a stray click mailed a customer, 2026-11-09)
          <AdminForm action={definirEtapaAction.bind(null, p.ref)}>
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">Etapa</legend>
              {ETAPAS.map((s) => (
                <label
                  key={s.v}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-wood has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper"
                >
                  <input type="radio" name="etapa" value={s.v} defaultChecked={etapa === s.v} className="sr-only" />
                  {s.t}
                  {p.etapaEm?.[s.v] ? <span className="font-normal opacity-70">{quando(p.etapaEm[s.v]).slice(0, 5)}</span> : null}
                </label>
              ))}
            </fieldset>
            <label className="mt-4 flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="avisar" value="1" defaultChecked className="h-4 w-4 accent-[var(--wood)]" />
              Avisar a cliente por e-mail (enviado e entregue)
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <SaveButton>Salvar andamento</SaveButton>
              <span className="text-xs text-ink-soft">Escolher a etapa não manda nada: só vale depois de salvar.</span>
            </div>
          </AdminForm>
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
            <p className="text-sm text-ink-soft">
              {p.origem === "painel"
                ? "Essa venda foi lançada sem CPF e endereço completo. Faça a etiqueta direto no site do Melhor Envio."
                : "Esse pedido não tem CPF e endereço completo guardados (é de antes de 06/10). Faça a etiqueta direto no site do Melhor Envio."}
            </p>
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
