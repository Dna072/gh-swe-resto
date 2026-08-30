import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { LocalizedPageBanner } from "@/components/brand/localized-page-banner";
import { CartView } from "@/components/storefront/cart-view";
import { getTranslator } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return {
    title: t("cart.metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function CartPage() {
  return (
    <CustomerShell>
      <main id="main">
        <LocalizedPageBanner
          eyebrowKey="cart.eyebrow"
          titleKey="cart.title"
          descriptionKey="cart.description"
        />
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <CartView />
        </div>
      </main>
    </CustomerShell>
  );
}
