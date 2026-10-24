import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { CheckIcon } from "@/components/icons";
import { lerPedido, type PedidoCliente } from "@/lib/clientes";
import { getContent } from "@/lib/content-store";
import { formatBRL, PRAZO_PRODUCAO_DIAS_UTEIS } from "@/lib/offer";
import { codigoDoPedido, noPagamento } from "@/lib/pedido";
import { linkRastreio } from "@/lib/rastreio";
import { fotosDaProducao } from "@/lib/fotos-producao";
import { redisAtivo } from "@/lib/redis";
import { whatsappUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seu pedido",
  robots: { index: false, follow: false },
};

// One order's progress (2026-10-06). The URL carries the order's random
// reference (a UUID), so only who got the link sees it — and even then no
// address, phone or CPF is shown, just first name, city, items and steps.

const quando = (t?: number) =>
  t
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(t))
    : "";

type Passo = { titulo: string; texto?: React.ReactNode; feito: boolean; atual: boolean; em?: number; ruim?: boolean };

function passos(p: PedidoCliente): Passo[] {
  const pago = p.status === "pago";
  const etapa = p.etapa ?? (pago ? "producao" : undefined);
  const enviado = etapa === "enviado" || etapa === "entregue";
  const entregue = etapa === "entregue";
  return [
    { titulo: "Pedido feito", feito: true, atual: false, em: p.em },
    pago
      ? { titulo: "Pagamento aprovado", feito: true, atual: false, em: p.pagoEm }
      : p.status === "recusado"
        ? { titulo: "Pagamento não aprovado", texto: "O pagamento foi recusado. Se quiser, fale com a gente no WhatsApp.", feito: false, atual: true, ruim: true }
        : { titulo: "Aguardando pagamento", texto: "Assim que o pagamento for confirmado, a gente começa a trançar.", feito: false, atual: true },
    {
      titulo: "Em produção",
      texto: pago && !enviado ? `Sua cadeira está sendo trançada à mão. Leva até ${PRAZO_PRODUCAO_DIAS_UTEIS} dias úteis.` : undefined,
      feito: enviado,
      atual: pago && !enviado,
      em: p.etapaEm?.producao ?? p.pagoEm,
    },
    {
      titulo: "Enviado",
      texto:
        enviado && p.rastreio ? (
          <>
            {p.transportadora ? `${p.transportadora}, código ` : "Código "}
            <strong className="font-mono text-ink">{p.rastreio}</strong>.{" "}
            <a href={linkRastreio(p.rastreio)} target="_blank" rel="noreferrer" className="font-medium text-ink underline underline-offset-2">
              Ver onde está
            </a>
          </>
        ) : enviado ? (
          "Já saiu do ateliê. O código de rastreio aparece aqui assim que a transportadora liberar."
        ) : undefined,
      feito: entregue,
      atual: enviado && !entregue,
      em: p.etapaEm?.enviado,
    },
    { titulo: "Entregue", texto: entregue ? "Aproveite a sua cadeira! ☀️" : undefined, feito: entregue, atual: false, em: p.etapaEm?.entregue },
  ];
}

export default async function PedidoAcompanhar({ params }: PageProps<"/acompanhar/[ref]">) {
  const { ref } = await params;
  if (!redisAtivo()) notFound();
  const p = await lerPedido(ref);
  if (!p) notFound();
  const { site } = await getContent();
  const lista = passos(p);
  const soVale = Boolean(p.vales?.length) && (!p.porTipo || p.porTipo.normal + p.porTipo.infantil + p.porTipo.reclinavel === 0);
  const primeiroNome = p.nome.trim().split(/\s+/)[0];
  // photos the atelier takes while weaving it (lib/fotos-producao.ts)
  const fotos = soVale ? [] : await fotosDaProducao(p.ref).catch(() => []);

  return (
    <>
      <PageHeader titulo={`Pedido ${codigoDoPedido(p.ref)}`} resumo={`Olá, ${primeiroNome}! Aqui você acompanha o seu pedido${soVale ? "" : ` para ${p.cidade}`}.`} voltarPara="/acompanhar" />
      <section className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-8 px-6 py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {soVale ? (
          <div className="max-w-xl text-sm leading-relaxed text-ink-soft">
            <p className="font-serif text-lg font-medium tracking-tight text-ink">Pedido de vale-presente</p>
            <p className="mt-1">
              {p.status === "pago"
                ? "Pagamento aprovado. O vale-presente não tem envio: o código está aqui ao lado, pronto para dar de presente."
                : "Assim que o pagamento for aprovado, o código do vale-presente aparece aqui."}
            </p>
          </div>
        ) : (
        <ol className="relative max-w-xl">
          {lista.map((s, i) => (
            <li key={s.titulo} className="relative flex gap-4 pb-8 last:pb-0">
              {i < lista.length - 1 ? (
                <span aria-hidden className={`absolute left-[0.9rem] top-8 h-[calc(100%-2rem)] w-px ${s.feito ? "bg-verde" : "bg-line"}`} />
              ) : null}
              <span
                className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  s.ruim
                    ? "border-clay bg-clay text-paper"
                    : s.feito
                      ? "border-verde bg-verde text-white"
                      : s.atual
                        ? "border-verde bg-paper text-verde-escuro ring-4 ring-verde/15"
                        : "border-line bg-paper text-ink-soft"
                }`}
              >
                {s.feito ? <CheckIcon className="h-4 w-4" /> : s.ruim ? "!" : i + 1}
              </span>
              <div className="pt-0.5">
                <p className={`font-serif text-lg font-medium tracking-tight ${s.feito || s.atual ? "text-ink" : "text-ink-soft"}`}>{s.titulo}</p>
                {s.em && (s.feito || s.atual) ? <p className="text-xs text-ink-soft">{quando(s.em)}</p> : null}
                {s.texto ? <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.texto}</p> : null}
              </div>
            </li>
          ))}
        </ol>
        )}

        {fotos.length ? (
          <div className="min-w-0 md:col-span-2 md:row-start-2">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">A sua cadeira sendo feita</h2>
            <p className="mt-1 text-sm text-ink-soft">Fotos tiradas no ateliê, enquanto a gente trança a sua.</p>
            <ul className="mt-5 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-4 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
              {fotos.map((f) => (
                <li key={f.id}>
                  <a href={`/api/producao/${p.ref}/${f.id}`} target="_blank" rel="noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/producao/${p.ref}/${f.id}`} alt={f.legenda} className="aspect-square w-full border border-line object-cover" />
                  </a>
                  <p className="mt-2 text-sm text-ink">{f.legenda}</p>
                  <p className="text-xs text-ink-soft">{quando(f.em)}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <aside className="h-fit border border-line bg-paper p-5 text-sm">
          <p className="font-serif text-lg font-medium tracking-tight text-ink">Resumo</p>
          <ul className="mt-3 space-y-1 text-ink">
            {p.itens.map((i, k) => (
              <li key={k}>{i}</li>
            ))}
          </ul>
          {p.codigosVale?.length ? (
            <div className="mt-3 border-2 border-ink bg-canvas p-3">
              <p className="font-medium text-ink">{p.codigosVale.length === 1 ? "Código do vale-presente" : "Códigos dos vales-presente"}</p>
              {p.codigosVale.map((v) => (
                <p key={v.codigo} className="mt-1">
                  <strong className="font-mono text-lg tracking-widest text-ink">{v.codigo}</strong>
                  <span className="block text-xs text-ink-soft">
                    {formatBRL(v.valor)}
                    {v.para ? ` para ${v.para}` : ""}, vale até {v.validoAte.split("-").reverse().join("/")}. Use em &ldquo;Tem cupom de desconto?&rdquo; no carrinho.
                  </span>
                </p>
              ))}
            </div>
          ) : null}
          <p className="mt-3 border-t border-line pt-3 text-ink-soft">
            Total: <strong className="text-ink">{formatBRL(p.valor)}</strong> {noPagamento(p.forma)}
          </p>
          <a
            href={whatsappUrl(site.whatsappNumero, `Oi! Quero falar sobre o meu pedido ${codigoDoPedido(p.ref)}.`)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-verde px-5 py-2.5 font-semibold text-white hover:bg-verde-escuro"
          >
            Falar sobre o pedido
          </a>
          <Link href="/" className="mt-3 block text-center text-xs text-ink-soft underline underline-offset-2 hover:text-ink">
            Voltar para a loja
          </Link>
        </aside>
      </section>
    </>
  );
}
