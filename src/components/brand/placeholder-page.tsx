import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <CustomerShell>
      <main id="main">
        <PageBanner
          eyebrow="Coming later"
          title={title}
          description="This route is reserved. Menu, cart, and guest checkout are live. Accounts and kitchen tools come later."
        />
        <div className="mx-auto max-w-xl px-4 py-12 text-center">
          <Button size="touch" variant="gold" asChild>
            <Link href="/menu">View today’s menu</Link>
          </Button>
        </div>
      </main>
    </CustomerShell>
  );
}
