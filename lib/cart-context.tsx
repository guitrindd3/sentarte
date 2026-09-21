"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  categoriaSlug: string;
  categoriaTitulo: string;
  modeloId: string;
  modeloNome: string;
  imagemUrl?: string;
  corA: string;
  corB: string;
  quantidade: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantidade">) => void;
  removeItem: (id: string) => void;
  setQuantidade: (id: string, quantidade: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "sentarte-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // One-time sync from an external system (localStorage) on mount — SSR
    // has no access to it, so the cart must render empty first and adopt
    // the persisted value right after hydration.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore — start with an empty cart
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore — cart just won't persist across reloads
    }
  }, [items, hydrated]);

  const addItem = (item: Omit<CartItem, "quantidade">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [...prev, { ...item, quantidade: 1 }];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const setQuantidade = (id: string, quantidade: number) => {
    if (quantidade < 1) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantidade } : i)));
  };

  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantidade, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        isOpen,
        addItem,
        removeItem,
        setQuantidade,
        clear,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
