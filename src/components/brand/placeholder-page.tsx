import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerShell } from "@/components/brand/customer-shell";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <CustomerShell>
      <main id="main" className="mx-auto max-w-xl px-4 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-earth">Coming later</p>
        <h1 className="mt-3 font-heading text-4xl">{title}</h1>
        <p className="mt-3 text-muted-foreground">
          This route is reserved. Phase 2 is the public menu and cart. Orders and accounts follow
          with checkout.
        </p>
        <Button size="touch" className="mt-6" asChild>
          <Link href="/menu">View today’s menu</Link>
        </Button>
      </main>
    </CustomerShell>
  );
}
