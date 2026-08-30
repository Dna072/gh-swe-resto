import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";
import { getTranslator } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getTranslator();
  return (
    <CustomerShell>
      <main id="main">
        <PageBanner
          eyebrow={t("notFound.eyebrow")}
          title={t("notFound.title")}
          description={t("notFound.description")}
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
