"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/lib/types";
import { makeLineId } from "@/lib/utils";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  addItem: (product: Product, quantity: number, options: Record<string, string>) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "tubaroes-uvv-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) setItems(JSON.parse(stored) as CartItem[]);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const addItem = useCallback((product: Product, quantity: number, options: Record<string, string>) => {
    const lineId = makeLineId(product.id, options);
    const variant = product.variants?.find((candidate) => candidate.active && Object.entries(candidate.options).every(([key, value]) => options[key] === value));
    const availableStock = variant?.stock ?? product.stock;
    setItems((current) => {
      const existing = current.find((item) => item.lineId === lineId);
      if (existing) {
        return current.map((item) =>
          item.lineId === lineId
            ? { ...item, quantity: Math.min(item.quantity + quantity, availableStock) }
            : item,
        );
      }
      return [
        ...current,
        {
          lineId,
          productId: product.id,
          variantId: variant?.id,
          slug: product.slug,
          name: product.name,
          image: variant?.image ?? product.image,
          sku: variant?.sku ?? product.sku,
          unitPrice: variant?.price ?? product.price,
          quantity: Math.min(quantity, availableStock),
          stock: availableStock,
          options,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.lineId === lineId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) } : item,
      ),
    );
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((current) => current.filter((item) => item.lineId !== lineId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      hydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, hydrated, addItem, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de CartProvider.");
  return context;
}
