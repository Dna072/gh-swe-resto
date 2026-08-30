"use client";

import { CartProvider } from "@/components/cart/cart-provider";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Locale } from "@/lib/i18n/locales";

export function Providers({
  restaurantId,
  locale,
  children,
}: {
  restaurantId: string;
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider key={locale} locale={locale}>
      <CartProvider restaurantId={restaurantId}>
        {children}
        <Toaster />
      </CartProvider>
    </LocaleProvider>
  );
}
