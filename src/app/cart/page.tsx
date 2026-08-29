import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { SectionHeading } from "@/components/brand/section-heading";
import { CartView } from "@/components/storefront/cart-view";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <CustomerShell>
      <main id="main" className="mx-auto w-full max-w-5xl px-4 py-10">
        <SectionHeading
          eyebrow="Cart"
          title="Your order"
          description="Line totals come from a server quote. Checkout opens in Phase 3."
        />
        <div className="mt-8">
          <CartView />
        </div>
      </main>
    </CustomerShell>
  );
}
