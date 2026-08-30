import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";
import { OrderLookup } from "@/components/storefront/order-lookup";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return (
    <CustomerShell>
      <main id="main">
        <PageBanner
          eyebrow="Kitchen"
          title="Find a guest order"
          description="Use the link from checkout, or enter the public number and access token. The kitchen board updates this status."
        />
        <div className="mx-auto w-full max-w-xl px-4 py-12">
          <OrderLookup />
        </div>
      </main>
    </CustomerShell>
  );
}
