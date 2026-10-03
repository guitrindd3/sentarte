"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cepGuardado, guardarCep, textoFrete, useFrete } from "@/lib/use-frete";
import { CheckoutForm } from "@/components/checkout-form";
import { calcularPedido } from "@/lib/pedido";
import { useCart } from "@/lib/cart-context";
import { CloseIcon, MinusIcon, PlusIcon, WhatsAppIcon } from "@/components/icons";
import { WeavePattern } from "@/components/weave-pattern";
import {
  CATEGORIA_COM_PRECO,
  CUPOM_CODIGO,
  CUPOM_DESCONTO,
  CUPOM_MIN_ITENS,
  formatBRL,
  PARCELAS_MAX,
  PIX_DESCONTO,
  precoPix,
  precoItemCadeira,
} from "@/lib/offer";
import { whatsappUrl } from "@/lib/urls";

export function CartDrawer({ whatsappNumero, pagamentoAtivo }: { whatsappNumero: string; pagamentoAtivo: boolean }) {
  const { items, count, isOpen, closeCart, removeItem, setQuantidade, clear } = useCart();
  const [etapa, setEtapa] = useState<"carrinho" | "entrega">("carrinho");
  const [cep, setCep] = useState("");
  useEffect(() => {
    // CEP typed last time (localStorage) — only after hydration, like the cart itself
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCep(cepGuardado());
  }, []);
  const podePagar = pagamentoAtivo && calcularPedido(items).pagavel;
  const naEntrega = etapa === "entrega" && podePagar;

  // Only chairs have a fixed price; anything else is priced over WhatsApp.
  // A chair with a woven name costs PRECO_CADEIRA_COM_NOME.
  const cadeiras = items.filter((i) => i.categoriaSlug === CATEGORIA_COM_PRECO);
  const qtdCadeiras = cadeiras.reduce((soma, i) => soma + i.quantidade, 0);
  const subtotal = cadeiras.reduce(
    (soma, i) => soma + i.quantidade * precoItemCadeira(i),
    0
  );
  const temCupom = qtdCadeiras >= CUPOM_MIN_ITENS;
  const desconto = temCupom ? subtotal * CUPOM_DESCONTO : 0;
  const total = subtotal - desconto;
  const faltamParaCupom = CUPOM_MIN_ITENS - qtdCadeiras;
  const estadoFrete = useFrete(cep, cadeiras);
  const valorFrete = estadoFrete.tipo === "ok" ? estadoFrete.frete.valor : null;
  const prazoFrete = estadoFrete.tipo === "ok" ? estadoFrete.frete.prazoDias : undefined;
  const totalComFrete = total + (valorFrete ?? 0);
  const pixComFrete = precoPix(total) + (valorFrete ?? 0);

  const resumoValores =
    qtdCadeiras === 0
      ? []
      : [
          "",
          `Subtotal: ${formatBRL(subtotal)}`,
          ...(temCupom
            ? [`Cupom ${CUPOM_CODIGO} (${Math.round(CUPOM_DESCONTO * 100)}%): -${formatBRL(desconto)}`]
            : []),
          valorFrete === null
            ? `Frete: a calcular${cep ? ` (CEP ${cep})` : ""}`
            : `Frete (CEP ${cep}): ${valorFrete === 0 ? "grátis" : formatBRL(valorFrete)}`,
          `Total: ${formatBRL(totalComFrete)}${valorFrete === null ? " + frete" : ""}`,
          `No Pix (${Math.round(PIX_DESCONTO * 100)}% off): ${formatBRL(pixComFrete)}${valorFrete === null ? " + frete" : ""}`,
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
              (i.nomePersonalizado ? ` — nome: "${i.nomePersonalizado}"` : "")
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
            <CheckoutForm items={items} onVoltar={() => setEtapa("carrinho")} />
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
                      <WeavePattern colorA={item.corA} colorB={item.corB} cell={10} band={7} className="h-full w-full" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium text-ink">{item.modeloNome}</p>
                    <p className="text-xs text-ink-soft">{item.categoriaTitulo}</p>
                    {item.variante ? (
                      <p className="text-xs italic text-ink-soft">Cor: {item.variante}</p>
                    ) : null}
                    {item.nomePersonalizado ? (
                      <p className="text-xs italic text-ink-soft">Nome: {item.nomePersonalizado}</p>
                    ) : null}
                    {item.categoriaSlug === CATEGORIA_COM_PRECO ? (
                      <p className="text-xs text-ink">{formatBRL(precoItemCadeira(item))}</p>
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
        </div>

        {items.length > 0 && !naEntrega ? (
          <div className="border-t border-line px-6 py-4">
            {qtdCadeiras > 0 ? (
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <dt>
                    Subtotal ({count} {count === 1 ? "item" : "itens"})
                  </dt>
                  <dd>{formatBRL(subtotal)}</dd>
                </div>
                {temCupom ? (
                  <div className="flex justify-between text-ink">
                    <dt>
                      Cupom {CUPOM_CODIGO} ({Math.round(CUPOM_DESCONTO * 100)}%)
                    </dt>
                    <dd>-{formatBRL(desconto)}</dd>
                  </div>
                ) : null}
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
                <div className="flex justify-between border-t border-line pt-2 font-medium text-ink">
                  <dt>Total{valorFrete === null ? " (sem frete)" : ""}</dt>
                  <dd>{formatBRL(totalComFrete)}</dd>
                </div>
                <div className="flex justify-between text-ink">
                  <dt>No Pix ({Math.round(PIX_DESCONTO * 100)}% off)</dt>
                  <dd>{formatBRL(pixComFrete)}</dd>
                </div>
                <p className="text-xs text-ink-soft">ou em até {PARCELAS_MAX}x no cartão</p>
                {faltamParaCupom > 0 ? (
                  <p className="pt-1 text-xs text-ink">
                    Leve mais {faltamParaCupom} e ganhe {Math.round(CUPOM_DESCONTO * 100)}% de desconto com o
                    cupom {CUPOM_CODIGO}.
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
