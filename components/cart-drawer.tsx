"use client";

import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { CloseIcon, MinusIcon, PlusIcon, WhatsAppIcon } from "@/components/icons";
import { WeavePattern } from "@/components/weave-pattern";
import { whatsappUrl } from "@/lib/urls";

export function CartDrawer({ whatsappNumero }: { whatsappNumero: string }) {
  const { items, count, isOpen, closeCart, removeItem, setQuantidade, clear } = useCart();

  const mensagem =
    items.length === 0
      ? ""
      : [
          "Oi! Quero fechar esse pedido:",
          ...items.map(
            (i) =>
              `- ${i.categoriaTitulo} — ${i.modeloNome} (x${i.quantidade})` +
              (i.variante ? ` — cor: ${i.variante}` : "") +
              (i.nomePersonalizado ? ` — nome: "${i.nomePersonalizado}"` : "")
          ),
          "Pode me ajudar a confirmar valores e prazo?",
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
            className="text-ink-soft transition-colors hover:text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <p className="mt-8 text-center text-sm text-ink-soft">Seu carrinho está vazio.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 border-b border-line pb-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-line">
                    {item.imagemUrl ? (
                      <Image src={item.imagemUrl} alt={item.modeloNome} fill className="object-cover" sizes="64px" />
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

        {items.length > 0 ? (
          <div className="border-t border-line px-6 py-4">
            <p className="text-sm text-ink-soft">
              {count} {count === 1 ? "item" : "itens"} no carrinho
            </p>
            <a
              href={whatsappUrl(whatsappNumero, mensagem)}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                clear();
                closeCart();
              }}
              className="mt-3 flex items-center justify-center gap-2 border border-ink bg-ink px-4 py-3 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Finalizar pedido no WhatsApp
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
