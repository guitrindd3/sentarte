"use client";

import { useEffect, useRef, useState } from "react";
import { CartIcon, CheckIcon } from "@/components/icons";
import { useCart, type CartItem } from "@/lib/cart-context";

export function AddToCartButton({
  item,
  disabled = false,
  contorno = false,
  curtoNoCelular = false,
}: {
  item: Omit<CartItem, "quantidade">;
  disabled?: boolean;
  /** Outline style (next to a filled "Comprar"). */
  contorno?: boolean;
  /** Phones: only the icon (the label stays for screen readers). */
  curtoNoCelular?: boolean;
}) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        addItem(item);
        setJustAdded(true);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setJustAdded(false), 1800);
      }}
      className={
        // relative: keeps the sr-only label inside the button — without it, in the
        // homepage's sliding row, it widened the whole page on phones (2026-10-20)
        (curtoNoCelular ? "relative max-sm:px-3.5 " : "") +
        (contorno
          ? "inline-flex items-center justify-center gap-2 border border-ink px-4 py-2.5 text-sm font-medium text-ink transition-all duration-200 hover:bg-ink hover:text-canvas active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
          : "mt-4 inline-flex items-center justify-center gap-2 border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition-all duration-200 hover:bg-transparent hover:text-ink active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink disabled:hover:text-canvas")
      }
    >
      {justAdded ? (
        <>
          <CheckIcon className="h-4 w-4" />
          <span className={curtoNoCelular ? "max-sm:sr-only" : ""}>Adicionado</span>
        </>
      ) : (
        <>
          <CartIcon className="h-4 w-4" />
          <span className={curtoNoCelular ? "max-sm:sr-only" : ""}>Adicionar ao carrinho</span>
        </>
      )}
    </button>
  );
}
