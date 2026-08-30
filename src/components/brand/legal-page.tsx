import type { ReactNode } from "react";
import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";

export function LegalPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <CustomerShell>
      <main id="main">
        <PageBanner eyebrow={eyebrow} title={title} />
        <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
          <div className="space-y-4 text-muted-foreground">{children}</div>
        </div>
      </main>
    </CustomerShell>
  );
}
