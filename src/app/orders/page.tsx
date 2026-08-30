import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { SectionHeading } from "@/components/brand/section-heading";
import { OrderLookup } from "@/components/storefront/order-lookup";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return (
    <CustomerShell>
      <main id="main" className="mx-auto w-full max-w-xl px-4 py-10">
        <SectionHeading
          eyebrow="Orders"
          title="Find a guest order"
          description="Use the link from checkout, or enter the public number and access token. The kitchen board updates this status."
        />
        <div className="mt-8">
          <OrderLookup />
        </div>
      </main>
    </CustomerShell>
  );
}
