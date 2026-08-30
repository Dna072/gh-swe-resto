import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerShell } from "@/components/brand/customer-shell";
import { LocalizedPageBanner } from "@/components/brand/localized-page-banner";
import { LocalizedCopy } from "@/components/i18n/localized-copy";

export default function NotFound() {
  return (
    <CustomerShell>
      <main id="main">
        <LocalizedPageBanner
          eyebrowKey="notFound.eyebrow"
          titleKey="notFound.title"
          descriptionKey="notFound.description"
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
