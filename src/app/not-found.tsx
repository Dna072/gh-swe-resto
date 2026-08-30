import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";

export default function NotFound() {
  return (
    <CustomerShell>
      <main id="main">
        <PageBanner
          eyebrow="Pardon"
          title="That page is not on the menu"
          description="The link may be old, or the meal is no longer listed."
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
