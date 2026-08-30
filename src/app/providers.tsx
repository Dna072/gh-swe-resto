"use client";

import { CartProvider } from "@/components/cart/cart-provider";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { PageTracker } from "@/components/analytics/page-tracker";
import { DiscountInvite } from "@/components/storefront/discount-invite";
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
        <PageTracker />
        {children}
        <DiscountInvite />
        <Toaster />
      </CartProvider>
    </LocaleProvider>
  );
}
