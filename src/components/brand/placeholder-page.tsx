import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";
import { getTranslator } from "@/lib/i18n/server";

export async function PlaceholderPage({ title }: { title: string }) {
  const t = await getTranslator();
  return (
    <CustomerShell>
      <main id="main">
        <PageBanner
          eyebrow={t("placeholder.eyebrow")}
          title={title}
          description={t("placeholder.body")}
        />
        <div className="mx-auto max-w-xl px-4 py-12 text-center">
          <Button size="touch" variant="gold" asChild>
            <Link href="/menu">{t("cart.viewMenu")}</Link>
          </Button>
        </div>
      </main>
    </CustomerShell>
  );
}
