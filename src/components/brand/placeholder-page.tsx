import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerShell } from "@/components/brand/customer-shell";
import { LocalizedPageBanner } from "@/components/brand/localized-page-banner";
import { LocalizedCopy } from "@/components/i18n/localized-copy";
import type { MessageKey } from "@/lib/i18n/messages";

export function PlaceholderPage({ titleKey }: { titleKey: MessageKey }) {
  return (
    <CustomerShell>
      <main id="main">
        <LocalizedPageBanner
          eyebrowKey="placeholder.eyebrow"
          titleKey={titleKey}
          descriptionKey="placeholder.body"
        />
        <div className="mx-auto max-w-xl px-4 py-12 text-center">
          <Button size="touch" variant="gold" asChild>
            <Link href="/menu">
              <LocalizedCopy messageKey="cart.viewMenu" />
            </Link>
          </Button>
        </div>
      </main>
    </CustomerShell>
  );
}
