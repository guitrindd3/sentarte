"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/offer";
import { descricaoItem, entregaEmTexto, PEDIDO_STORAGE_KEY, type PedidoSalvo } from "@/lib/pedido";
import { whatsappUrl } from "@/lib/urls";

type Props = {
  situacao: "aprovado" | "pendente" | "recusado" | "desconhecido";
  pagamentoId?: string;
  referencia?: string;
  valorPago?: number;
  parcelas?: number;
  whatsappNumero: string;
};

const TEXTOS = {
  aprovado: {
    titulo: "Pagamento aprovado!",
    texto: "Obrigado! Agora é só mandar o resumo no WhatsApp para a gente confirmar os detalhes e começar a trançar.",
  },
  pendente: {
    titulo: "Pagamento em análise",
    texto: "O Mercado Pago ainda está processando o pagamento. Assim que for aprovado, a gente começa. Mande o resumo no WhatsApp para acompanhar.",
  },
  recusado: {
    titulo: "O pagamento não foi concluído",
    texto: "Nada foi cobrado. Você pode tentar de novo pelo carrinho ou fechar o pedido direto pelo WhatsApp.",
  },
  desconhecido: {
    titulo: "Seu pedido",
    texto: "Não conseguimos confirmar o pagamento por aqui. Mande o resumo no WhatsApp que a gente confere para você.",
  },
};

export function PedidoResultado({ situacao, pagamentoId, referencia, valorPago, parcelas, whatsappNumero }: Props) {
  const { clear, openCart } = useCart();
  const [pedido, setPedido] = useState<PedidoSalvo | null>(null);

  useEffect(() => {
    // Summary saved by the cart right before going to Mercado Pago.
    try {
      const raw = window.localStorage.getItem(PEDIDO_STORAGE_KEY);
      const salvo = raw ? (JSON.parse(raw) as PedidoSalvo) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (salvo && (!referencia || salvo.referencia === referencia)) setPedido(salvo);
    } catch {
      // no summary available — the page still works without it
    }
  }, [referencia]);

  useEffect(() => {
    if (situacao === "aprovado") clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [situacao]);

  const t = TEXTOS[situacao];
  const mensagem = [
    situacao === "aprovado" ? "Oi! Acabei de fazer um pedido pelo site e já paguei ✅" : "Oi! Fiz um pedido pelo site:",
    ...(pedido ? ["", ...pedido.itens.map((i) => `- ${descricaoItem(i)}`)] : []),
    "",
    situacao === "aprovado" && valorPago
      ? `Pago: ${formatBRL(valorPago)}${pedido?.forma === "pix" ? " no Pix" : parcelas && parcelas > 1 ? ` no cartão em ${parcelas}x` : " no cartão"}`
      : `Pagamento: ${situacao === "pendente" ? "em análise" : "não concluído"}`,
    ...(pagamentoId ? [`Nº do pagamento (Mercado Pago): ${pagamentoId}`] : []),
    ...(pedido ? ["", "Entrega:", entregaEmTexto(pedido.entrega)] : []),
  ].join("\n");

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="max-w-xl border border-line bg-paper p-6 md:p-8">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            situacao === "aprovado" ? "bg-verde text-white" : "bg-canvas-deep text-ink"
          }`}
        >
          {situacao === "aprovado" ? <CheckIcon className="h-6 w-6" /> : <span className="text-xl">!</span>}
        </div>
        <h1 className="mt-5 font-serif text-3xl font-medium tracking-tight text-ink">{t.titulo}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t.texto}</p>

        {pedido ? (
          <ul className="mt-6 space-y-1 border-y border-line py-4 text-sm text-ink">
            {pedido.itens.map((i, k) => (
              <li key={k}>{descricaoItem(i)}</li>
            ))}
          </ul>
        ) : null}
        {valorPago ? (
          <p className="mt-4 text-sm text-ink">
            Valor pago: <strong>{formatBRL(valorPago)}</strong>
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={whatsappUrl(whatsappNumero, mensagem)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-verde px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-verde-escuro"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Mandar resumo no WhatsApp
          </a>
          {situacao === "recusado" ? (
            <button
              type="button"
              onClick={openCart}
              className="inline-flex items-center justify-center border border-ink px-6 py-3 text-sm font-medium text-ink"
            >
              Tentar de novo
            </button>
          ) : (
            <Link href="/" className="inline-flex items-center justify-center border border-line px-6 py-3 text-sm text-ink-soft hover:border-ink hover:text-ink">
              Voltar para o início
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
