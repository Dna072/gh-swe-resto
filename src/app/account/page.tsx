import { PlaceholderPage } from "@/components/brand/placeholder-page";
import { getTranslator } from "@/lib/i18n/server";

export default async function AccountPlaceholder() {
  const t = await getTranslator();
  return <PlaceholderPage title={t("nav.account")} />;
}
