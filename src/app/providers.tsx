"use client";

import { CartProvider } from "@/components/cart/cart-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({
  restaurantId,
  children,
}: {
  restaurantId: string;
  children: React.ReactNode;
}) {
  return (
    <CartProvider restaurantId={restaurantId}>
      {children}
      <Toaster />
    </CartProvider>
  );
}
