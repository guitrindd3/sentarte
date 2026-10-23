"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cepGuardado, guardarCep, textoFrete, useFrete } from "@/lib/use-frete";
import { CheckoutForm } from "@/components/checkout-form";
import { CATEGORIA_VALE, valorDoVale } from "@/lib/vale";
import { VagasSemana } from "@/components/vagas-semana";
import { calcularPedido } from "@/lib/pedido";
import { useCart } from "@/lib/cart-context";
import { CloseIcon, MinusIcon, PlusIcon, PresenteIcon, WhatsAppIcon } from "@/components/icons";
import { WeavePattern } from "@/components/weave-pattern";
import { melhorCupom, rotuloDesconto } from "@/lib/cupom";
import { useCupons } from "@/lib/use-cupons";
import {
  CATEGORIA_COM_PRECO,
  formatBRL,
  PARCELAS_MAX,
  PIX_DESCONTO,
  precoCadeira,
  precoItemCadeira,
  PRECO_CADEIRA,
  rotuloTassel,
} from "@/lib/offer";
import { whatsappUrl } from "@/lib/urls";

/** A chair the cart can suggest ("Combina com o seu pedido"), from lib/produtos.ts. */
export type Sugestao = {
  slug: string;
  nome: string;
  modeloId: string;
  imagemUrl?: string;
  corA: string;
  corB: string;
  grupo: string;
  desenho: boolean;
};

export function CartDrawer({
  whatsappNumero,
  pagamentoAtivo,
  sugestoes = [],
  categoriaTitulo = "Cadeiras de praia",
}: {
  whatsappNumero: string;
  pagamentoAtivo: boolean;
  sugestoes?: Sugestao[];
  categoriaTitulo?: string;
}) {
  const { items, count, isOpen, closeCart, removeItem, setQuantidade, clear, etapa, setEtapa, addItem } = useCart();
  const [cep, setCep] = useState("");
  useEffect(() => {
    // CEP typed last time (localStorage) — only after hydration, like the cart itself
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCep(cepGuardado());
  }, []);
  const cupons = useCupons();
  const [abrirCupom, setAbrirCupom] = useState(false);
  const [codigo, setCodigo] = useState("");
  const conta = calcularPedido(items, cupons.cupons);
  const podePagar = pagamentoAtivo && conta.pagavel;
  const naEntrega = etapa === "entrega" && podePagar;

  // Only chairs have a fixed price; anything else is priced over WhatsApp.
  // A chair with a woven name costs PRECO_CADEIRA_COM_NOME.
  const cadeiras = items.filter((i) => i.categoriaSlug === CATEGORIA_COM_PRECO);
  const { qtdCadeiras, subtotal, desconto, total, cupom, vale, descontoVale, valorVales, soVale } = conta;
  // "Compre junto" (2026-10-19): the next automatic coupon tier that gives a
  // bigger discount than the one applied now, priced with plain chairs, and
  // what the customer saves in reais by reaching it.
  const subida = (() => {
    if (!qtdCadeiras) return null;
    const taxaAtual = subtotal ? desconto / subtotal : 0;
    for (const c of [...cupons.automaticos].filter((c) => c.minCadeiras > qtdCadeiras).sort((a, b) => a.minCadeiras - b.minCadeiras)) {
      const faltam = c.minCadeiras - qtdCadeiras;
      const novoSubtotal = subtotal + faltam * PRECO_CADEIRA;
      const novo = melhorCupom(cupons.cupons.filter((x) => !x.vale), novoSubtotal, c.minCadeiras);
      if (!novo || novo.cupom.codigo !== c.codigo || novo.desconto / novoSubtotal <= taxaAtual + 0.0001) continue;
      return { faltam, cupom: c, descontoNovo: novo.desconto };
    }
    return null;
  })();
  // Suggestions: chairs not in the cart yet, same collection as what's in it first.
  const noCarrinho = new Set(items.map((i) => i.modeloNome.replace(/ personalizado$/, "")));
  const gruposNoCarrinho = new Set(sugestoes.filter((s) => noCarrinho.has(s.nome)).map((s) => s.grupo));
  const paraSugerir = qtdCadeiras
    ? [...sugestoes.filter((s) => !noCarrinho.has(s.nome) && s.imagemUrl)]
        .sort((a, b) => Number(gruposNoCarrinho.has(b.grupo)) - Number(gruposNoCarrinho.has(a.grupo)))
        .slice(0, 3)
    : [];
  const digitadoSemMinimo =
    cupons.digitado && cupom?.codigo !== cupons.digitado.codigo && vale?.codigo !== cupons.digitado.codigo ? cupons.digitado : null;
  const estadoFrete = useFrete(cep, cadeiras);
  const valorFrete = estadoFrete.tipo === "ok" ? estadoFrete.frete.valor : null;
  const prazoFrete = estadoFrete.tipo === "ok" ? estadoFrete.frete.prazoDias : undefined;
  // a vale-presente only cart ships nothing
  const freteFinal = soVale ? 0 : valorFrete;
  const totalComFrete = total + (freteFinal ?? 0);
  const pixComFrete = conta.totalPix + (freteFinal ?? 0);

  const resumoValores =
    qtdCadeiras === 0 && !valorVales
      ? []
      : [
          "",
          `Subtotal: ${formatBRL(subtotal + valorVales)}`,
          ...(cupom ? [`Cupom ${cupom.codigo} (${rotuloDesconto(cupom)}): -${formatBRL(desconto)}`] : []),
          ...(vale ? [`Vale-presente ${vale.codigo}: -${formatBRL(descontoVale)}`] : []),
          ...(soVale
            ? []
            : [
                valorFrete === null
                  ? `Frete: a calcular${cep ? ` (CEP ${cep})` : ""}`
                  : `Frete (CEP ${cep}): ${valorFrete === 0 ? "grátis" : formatBRL(valorFrete)}`,
              ]),
          `Total: ${formatBRL(totalComFrete)}${freteFinal === null ? " + frete" : ""}`,
          ...(pixComFrete < totalComFrete
            ? [`No Pix (${Math.round(PIX_DESCONTO * 100)}% off): ${formatBRL(pixComFrete)}${freteFinal === null ? " + frete" : ""}`]
            : []),
        ];

  const mensagem =
    items.length === 0
      ? ""
      : [
          "Oi! Quero fechar esse pedido:",
          ...items.map(
            (i) =>
              `- ${i.categoriaTitulo} — ${i.modeloNome} (x${i.quantidade})` +
              (i.categoriaSlug === CATEGORIA_COM_PRECO
                ? ` — ${formatBRL(precoItemCadeira(i))} cada`
                : "") +
              (i.variante ? ` — cor: ${i.variante}` : "") +
              (i.bracoMadeira ? " — braço de madeira" : "") +
              (i.tassel ? ` — ${rotuloTassel(i)}` : "") +
              (i.nomePersonalizado ? (i.categoriaSlug === CATEGORIA_VALE ? ` — para: ${i.nomePersonalizado}` : ` — nome: "${i.nomePersonalizado}"`) : "")
          ),
          ...resumoValores,
          "",
          "Pode me ajudar a finalizar?",
        ].join("\n");

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-ink/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-paper shadow-[-8px_0_24px_rgba(0,0,0,0.08)] transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Carrinho"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <p className="font-serif text-lg font-medium text-ink">Seu carrinho</p>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Fechar carrinho"
            className="-m-2 p-2 text-ink-soft transition-colors hover:text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {naEntrega ? (
          <div className="min-h-0 flex-1">
            <CheckoutForm items={items} cupons={cupons.cupons} codigoDigitado={cupons.digitado?.codigo} onVoltar={() => setEtapa("carrinho")} />
          </div>
        ) : null}
        <div className={`flex-1 overflow-y-auto px-6 py-4 ${naEntrega ? "hidden" : ""}`}>
          {items.length === 0 ? (
            <p className="mt-8 text-center text-sm text-ink-soft">Seu carrinho está vazio.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 border-b border-line pb-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-line">
                    {item.imagemUrl ? (
                      <Image
                        src={item.imagemUrl}
                        alt={item.modeloNome}
                        fill
                        // the builder's chair picture comes from /api/cadeira (a PNG with a query string)
                        unoptimized={item.imagemUrl.startsWith("/api/")}
                        className={item.imagemUrl.startsWith("/api/") ? "bg-white object-contain" : "object-cover"}
                        sizes="64px"
                      />
                    ) : (
                      item.categoriaSlug === CATEGORIA_VALE ? (
                        <span className="flex h-full w-full items-center justify-center bg-canvas text-ink">
                          <PresenteIcon className="h-7 w-7" />
                        </span>
                      ) : (
                        <WeavePattern colorA={item.corA} colorB={item.corB} cell={10} band={7} className="h-full w-full" />
                      )
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium text-ink">{item.modeloNome}</p>
                    <p className="text-xs text-ink-soft">{item.categoriaTitulo}</p>
                    {item.variante ? (
                      <p className="text-xs italic text-ink-soft">Cor: {item.variante}</p>
                    ) : null}
                    {item.bracoMadeira ? <p className="text-xs italic text-ink-soft">Braço de madeira</p> : null}
                    {item.tassel ? <p className="text-xs italic text-ink-soft">{rotuloTassel(item).replace(/^./, (c) => c.toUpperCase())}</p> : null}
                    {item.nomePersonalizado ? (
                      <p className="text-xs italic text-ink-soft">
                        {item.categoriaSlug === CATEGORIA_VALE ? "Para" : "Nome"}: {item.nomePersonalizado}
                      </p>
                    ) : null}
                    {item.categoriaSlug === CATEGORIA_COM_PRECO ? (
                      <p className="text-xs text-ink">{formatBRL(precoItemCadeira(item))}</p>
                    ) : valorDoVale(item) !== null ? (
                      <p className="text-xs text-ink">{formatBRL(valorDoVale(item)!)}</p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          onClick={() => setQuantidade(item.id, item.quantidade - 1)}
                          aria-label="Diminuir quantidade"
                          className="px-2 py-1 text-ink-soft transition-colors hover:text-ink"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm text-ink">{item.quantidade}</span>
                        <button
                          type="button"
                          onClick={() => setQuantidade(item.id, item.quantidade + 1)}
                          aria-label="Aumentar quantidade"
                          className="px-2 py-1 text-ink-soft transition-colors hover:text-ink"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-ink-soft underline transition-colors hover:text-ink"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {paraSugerir.length ? (
            <div className="mt-6">
              <p className="font-serif text-base font-medium text-ink">Combina com o seu pedido</p>
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {paraSugerir.map((s) => {
                  const preco = precoCadeira(s.desenho);
                  return (
                    <li key={s.slug} className="flex flex-col border border-line bg-canvas">
                      <Link href={`/cadeira/${s.slug}`} onClick={closeCart} className="relative block aspect-square overflow-hidden">
                        {s.imagemUrl ? <Image src={s.imagemUrl} alt={s.nome} fill className="object-cover" sizes="100px" /> : null}
                      </Link>
                      <div className="flex flex-1 flex-col p-2">
                        <p className="line-clamp-2 text-xs font-medium leading-tight text-ink">{s.nome}</p>
                        <p className="mt-0.5 text-xs text-ink-soft">{formatBRL(preco)}</p>
                        <button
                          type="button"
                          data-rastro={`Compre junto: ${s.nome}`}
                          onClick={() =>
                            addItem({
                              id: `${CATEGORIA_COM_PRECO}:${s.modeloId}`,
                              categoriaSlug: CATEGORIA_COM_PRECO,
                              categoriaTitulo,
                              modeloId: s.modeloId,
                              modeloNome: s.nome,
                              imagemUrl: s.imagemUrl,
                              corA: s.corA,
                              corB: s.corB,
                              personalizada: s.desenho || undefined,
                            })
                          }
                          className="mt-auto inline-flex items-center justify-center gap-1 border border-ink px-1 pt-1 pb-1 text-[0.7rem] font-medium text-ink transition-colors hover:bg-ink hover:text-canvas"
                        >
                          <PlusIcon className="h-3 w-3" />
                          Adicionar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-ink-soft">Sem nome. Para trançar um nome, abra a cadeira.</p>
            </div>
          ) : null}
        </div>

        {items.length > 0 && !naEntrega ? (
          <div className="border-t border-line px-6 py-4">
            {qtdCadeiras > 0 || valorVales > 0 ? (
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <dt>
                    Subtotal ({count} {count === 1 ? "item" : "itens"})
                  </dt>
                  <dd>{formatBRL(subtotal + valorVales)}</dd>
                </div>
                {cupom ? (
                  <div className="flex justify-between text-ink">
                    <dt className="flex items-center gap-2">
                      Cupom {cupom.codigo} ({rotuloDesconto(cupom)})
                      {cupons.digitado?.codigo === cupom.codigo ? (
                        <button type="button" onClick={cupons.remover} className="text-xs text-ink-soft underline underline-offset-2 hover:text-ink">
                          tirar
                        </button>
                      ) : null}
                    </dt>
                    <dd>-{formatBRL(desconto)}</dd>
                  </div>
                ) : null}
                {vale ? (
                  <div className="flex justify-between text-ink">
                    <dt className="flex items-center gap-2">
                      Vale-presente {vale.codigo}
                      <button type="button" onClick={cupons.remover} className="text-xs text-ink-soft underline underline-offset-2 hover:text-ink">
                        tirar
                      </button>
                    </dt>
                    <dd>-{formatBRL(descontoVale)}</dd>
                  </div>
                ) : null}
                {digitadoSemMinimo ? (
                  <p className="text-xs text-ink">
                    O cupom {digitadoSemMinimo.codigo} vale a partir de {digitadoSemMinimo.minCadeiras} cadeiras.{" "}
                    <button type="button" onClick={cupons.remover} className="underline underline-offset-2">
                      tirar
                    </button>
                  </p>
                ) : !cupons.digitado ? (
                  abrirCupom ? (
                    <form
                      className="flex items-center gap-2 py-1"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (await cupons.aplicar(codigo)) {
                          setAbrirCupom(false);
                          setCodigo("");
                        }
                      }}
                    >
                      <label htmlFor="cupom-codigo" className="sr-only">
                        Código do cupom
                      </label>
                      <input
                        id="cupom-codigo"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                        autoFocus
                        autoCapitalize="characters"
                        placeholder="CÓDIGO"
                        maxLength={20}
                        className="min-w-0 flex-1 border border-line bg-canvas px-2 py-1 text-sm uppercase text-ink focus:border-ink focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={cupons.conferindo || !codigo.trim()}
                        className="border border-ink px-3 py-1 text-sm text-ink hover:bg-ink hover:text-canvas disabled:opacity-40"
                      >
                        {cupons.conferindo ? "…" : "Aplicar"}
                      </button>
                    </form>
                  ) : (
                    <button type="button" onClick={() => setAbrirCupom(true)} className="text-xs text-ink-soft underline underline-offset-2 hover:text-ink">
                      Tem cupom de desconto?
                    </button>
                  )
                ) : null}
                {cupons.erro ? <p className="text-xs text-clay-dark">{cupons.erro}</p> : null}
                {soVale ? null : (
                  <>
                <div className="flex items-center justify-between gap-3 text-ink-soft">
                  <dt>
                    <label htmlFor="cep-frete">Frete</label>
                  </dt>
                  <dd className="flex items-center gap-2">
                    <input
                      id="cep-frete"
                      value={cep}
                      onChange={(e) => {
                        setCep(e.target.value);
                        guardarCep(e.target.value);
                      }}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="Seu CEP"
                      maxLength={9}
                      className="w-24 border border-line bg-canvas px-2 py-1 text-sm text-ink focus:border-ink focus:outline-none"
                    />
                    <span className="min-w-[4.5rem] text-right">{textoFrete(estadoFrete) ?? formatBRL(valorFrete ?? 0)}</span>
                  </dd>
                </div>
                {prazoFrete ? (
                  <p className="text-right text-xs text-ink-soft">entrega em até {prazoFrete} dias úteis depois de pronta</p>
                ) : null}
                  </>
                )}
                <div className="flex justify-between border-t border-line pt-2 font-medium text-ink">
                  <dt>Total{freteFinal === null ? " (sem frete)" : ""}</dt>
                  <dd>{formatBRL(totalComFrete)}</dd>
                </div>
                {pixComFrete < totalComFrete ? (
                  <div className="flex justify-between text-ink">
                    <dt>No Pix ({Math.round(PIX_DESCONTO * 100)}% off)</dt>
                    <dd>{formatBRL(pixComFrete)}</dd>
                  </div>
                ) : null}
                <p className="text-xs text-ink-soft">ou em até {PARCELAS_MAX}x no cartão</p>
                {qtdCadeiras > 0 ? <VagasSemana className="pt-1 text-xs" /> : null}
                {subida ? (
                  <p className="mt-1 border border-ink/20 bg-canvas px-3 py-2 text-xs text-ink">
                    Leve mais {subida.faltam} {subida.faltam === 1 ? "cadeira" : "cadeiras"} e o desconto sobe para{" "}
                    <strong className="font-semibold">{rotuloDesconto(subida.cupom)}</strong> (cupom {subida.cupom.codigo}): são{" "}
                    <strong className="font-semibold">{formatBRL(subida.descontoNovo)}</strong> de desconto no pedido.
                  </p>
                ) : null}
              </dl>
            ) : (
              <p className="text-sm text-ink-soft">
                {count} {count === 1 ? "item" : "itens"} no carrinho
              </p>
            )}
            {podePagar ? (
              <button
                type="button"
                onClick={() => setEtapa("entrega")}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-verde px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-verde-escuro"
              >
                Pagar agora (Pix ou cartão)
              </button>
            ) : null}
            <a
              href={whatsappUrl(whatsappNumero, mensagem)}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                clear();
                closeCart();
              }}
              className={`mt-2 flex items-center justify-center gap-2 border px-4 py-3 text-sm font-medium transition-colors ${
                podePagar
                  ? "border-line text-ink hover:border-ink"
                  : "border-ink bg-ink text-canvas hover:bg-transparent hover:text-ink"
              }`}
            >
              <WhatsAppIcon className="h-4 w-4" />
              {podePagar ? "Ou fechar pelo WhatsApp" : "Finalizar pedido no WhatsApp"}
            </a>
            <button
              type="button"
              onClick={clear}
              className="mt-2 w-full text-center text-xs text-ink-soft transition-colors hover:text-ink hover:underline"
            >
              Esvaziar carrinho
            </button>
          </div>
        ) : null}
      </aside>
    </>
  );
}
