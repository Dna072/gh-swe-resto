"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { emptyCart, itemCount, lineSignature } from "@/lib/cart/storage";
import { getCartSnapshot, getServerCartSnapshot, persistCart, subscribeCart } from "@/lib/cart/store";
import type { CartLine, CartModifierSelection } from "@/lib/cart/types";

type AddLineInput = {
  menuItemId: string;
  slug: string;
  name: string;
  quantity: number;
  modifiers: CartModifierSelection[];
  notes?: string;
};

type CartContextValue = {
  restaurantId: string;
  lines: CartLine[];
  itemCount: number;
  addLine: (input: AddLineInput) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  restaurantId,
  children,
}: {
  restaurantId: string;
  children: ReactNode;
}) {
  const cart = useSyncExternalStore(
    subscribeCart,
    () => getCartSnapshot(restaurantId),
    () => getServerCartSnapshot(restaurantId),
  );

  const addLine = useCallback(
    (input: AddLineInput) => {
      const current = getCartSnapshot(restaurantId);
      const incoming: CartLine = {
        id: crypto.randomUUID(),
        ...input,
      };
      const signature = lineSignature(incoming);
      const existing = current.lines.find((line) => lineSignature(line) === signature);
      persistCart({
        restaurantId,
        lines: existing
          ? current.lines.map((line) =>
              line.id === existing.id
                ? { ...line, quantity: Math.min(20, line.quantity + incoming.quantity) }
                : line,
            )
          : [...current.lines, incoming],
      });
    },
    [restaurantId],
  );

  const updateQuantity = useCallback(
    (lineId: string, quantity: number) => {
      const current = getCartSnapshot(restaurantId);
      persistCart({
        restaurantId,
        lines: current.lines
          .map((line) => (line.id === lineId ? { ...line, quantity } : line))
          .filter((line) => line.quantity > 0),
      });
    },
    [restaurantId],
  );

  const removeLine = useCallback(
    (lineId: string) => {
      const current = getCartSnapshot(restaurantId);
      persistCart({
        restaurantId,
        lines: current.lines.filter((line) => line.id !== lineId),
      });
    },
    [restaurantId],
  );

  const clear = useCallback(() => {
    persistCart(emptyCart(restaurantId));
  }, [restaurantId]);

  const value = useMemo<CartContextValue>(
    () => ({
      restaurantId,
      lines: cart.lines,
      itemCount: itemCount(cart.lines),
      addLine,
      updateQuantity,
      removeLine,
      clear,
    }),
    [addLine, cart.lines, clear, removeLine, restaurantId, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
