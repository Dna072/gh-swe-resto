import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { LocalizedPageBanner } from "@/components/brand/localized-page-banner";
import { AccountDashboard } from "@/components/storefront/account-dashboard";
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
        <AccountDashboard />
      </main>
    </CustomerShell>
  );
}
