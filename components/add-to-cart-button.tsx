"use client";

import { useEffect, useRef, useState } from "react";
import { CartIcon, CheckIcon } from "@/components/icons";
import { useCart, type CartItem } from "@/lib/cart-context";

export function AddToCartButton({ item }: { item: Omit<CartItem, "quantidade"> }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        addItem(item);
        setJustAdded(true);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setJustAdded(false), 1800);
      }}
      className="mt-4 inline-flex items-center justify-center gap-2 border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition-all duration-200 hover:bg-transparent hover:text-ink active:scale-[0.97]"
    >
      {justAdded ? (
        <>
          <CheckIcon className="h-4 w-4" />
          Adicionado
        </>
      ) : (
        <>
          <CartIcon className="h-4 w-4" />
          Adicionar ao carrinho
        </>
      )}
    </button>
  );
}
