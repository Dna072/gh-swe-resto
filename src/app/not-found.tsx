import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerShell } from "@/components/brand/customer-shell";

export default function NotFound() {
  return (
    <CustomerShell>
      <main id="main" className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-heading text-4xl">That page is not on the menu</h1>
        <p className="mt-3 text-muted-foreground">The link may be old, or the meal is no longer listed.</p>
        <Button size="touch" className="mt-6" asChild>
          <Link href="/menu">View today’s menu</Link>
        </Button>
      </main>
    </CustomerShell>
  );
}
