"use client";

import { useState } from "react";
import { PresenteIcon } from "@/components/icons";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/offer";
import { CATEGORIA_VALE, nomeDoVale, VALORES_VALE } from "@/lib/vale";

/** Value picker + "para quem" on /vale-presente; puts the vale in the cart. */
export function ComprarVale() {
  const { addItem, comprarAgora } = useCart();
  const [valor, setValor] = useState(VALORES_VALE[1].valor);
  const [para, setPara] = useState("");
  const paraLimpo = para.trim().slice(0, 40);
  const item = {
    id: `${CATEGORIA_VALE}:${valor}${paraLimpo ? `:${paraLimpo}` : ""}`,
    categoriaSlug: CATEGORIA_VALE,
    categoriaTitulo: "Vale-presente",
    modeloId: `vale-${valor}`,
    modeloNome: nomeDoVale(valor),
    corA: "#241c14",
    corB: "#e8dccb",
    nomePersonalizado: paraLimpo || undefined,
  };

  return (
    <div className="border border-line bg-paper p-6 md:p-8">
      <p className="text-sm font-medium text-ink">Escolha o valor</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Valor do vale">
        {VALORES_VALE.map((v) => (
          <button
            key={v.valor}
            type="button"
            role="radio"
            aria-checked={valor === v.valor}
            onClick={() => setValor(v.valor)}
            className={`border px-3 py-3 text-left transition-colors ${valor === v.valor ? "border-ink bg-ink text-canvas" : "border-line text-ink hover:border-ink"}`}
          >
            <span className="block font-serif text-lg font-medium">{formatBRL(v.valor)}</span>
            {v.rotulo !== formatBRL(v.valor) ? <span className={`block text-xs ${valor === v.valor ? "text-canvas/80" : "text-ink-soft"}`}>{v.rotulo}</span> : null}
          </button>
        ))}
      </div>

      <label className="mt-6 block max-w-sm">
        <span className="text-sm font-medium text-ink">Para quem é? (opcional)</span>
        <input
          value={para}
          onChange={(e) => setPara(e.target.value)}
          maxLength={40}
          placeholder="Ex: Maria"
          className="mt-1 w-full border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
        />
        <span className="mt-1 block text-xs text-ink-soft">Só para você lembrar no resumo do pedido.</span>
      </label>

      <div className="mt-6 flex items-baseline gap-2">
        <PresenteIcon className="h-5 w-5 self-center text-ink" />
        <span className="font-serif text-3xl font-medium text-ink">{formatBRL(valor)}</span>
        <span className="text-sm text-ink-soft">no Pix ou no cartão, sem frete</span>
      </div>
      <div className="mt-4 grid max-w-sm gap-2">
        <button
          type="button"
          data-rastro={`Comprar vale-presente: ${formatBRL(valor)}`}
          onClick={() => comprarAgora(item)}
          className="inline-flex items-center justify-center border border-ink bg-ink px-4 py-3 font-medium text-canvas transition-all hover:bg-transparent hover:text-ink active:scale-[0.97]"
        >
          Comprar vale-presente
        </button>
        <button
          type="button"
          onClick={() => addItem(item)}
          className="inline-flex items-center justify-center border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:border-ink"
        >
          Adicionar ao carrinho
        </button>
      </div>
    </div>
  );
}
