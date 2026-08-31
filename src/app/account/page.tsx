import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerShell } from "@/components/brand/customer-shell";
import { LocalizedPageBanner } from "@/components/brand/localized-page-banner";
import { LocalizedCopy } from "@/components/i18n/localized-copy";
import { getTranslator } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("account.title") };
}

export default function AccountPage() {
  return (
    <CustomerShell>
      <main id="main">
        <LocalizedPageBanner
          eyebrowKey="account.eyebrow"
          titleKey="account.title"
          descriptionKey="account.body"
        />
        <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 py-12 sm:flex-row sm:justify-center">
          <Button size="touch" variant="gold" asChild>
            <Link href="/orders">
              <LocalizedCopy messageKey="account.findOrder" />
            </Link>
          </Button>
          <Button size="touch" variant="gold-outline" asChild>
            <Link href="/contact">
              <LocalizedCopy messageKey="account.contact" />
            </Link>
          </Button>
        </div>
      </main>
    </CustomerShell>
  );
}
