import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";
import { CartView } from "@/components/storefront/cart-view";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <CustomerShell>
      <main id="main">
        <PageBanner
          eyebrow="Your table"
          title="Cart"
          description="Line totals come from a server quote. Delivery is added at checkout."
        />
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <CartView />
        </div>
      </main>
    </CustomerShell>
  );
}
