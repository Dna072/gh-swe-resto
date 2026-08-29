import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerShell } from "@/components/brand/customer-shell";
import { SectionHeading } from "@/components/brand/section-heading";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <CustomerShell>
      <main id="main" className="mx-auto max-w-xl px-4 py-16">
        <SectionHeading
          eyebrow="Phase 3"
          title="Checkout is next"
          description="Guest checkout, address, delivery quote and payment are intentionally not in this release."
        />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="touch" asChild>
            <Link href="/cart">Back to cart</Link>
          </Button>
          <Button size="touch" variant="outline" asChild>
            <Link href="/menu">Keep browsing</Link>
          </Button>
        </div>
      </main>
    </CustomerShell>
  );
}
