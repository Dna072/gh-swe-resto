"use client";

import { PageBanner } from "@/components/brand/page-banner";
import { useT } from "@/components/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

export function LocalizedPageBanner({
  eyebrowKey,
  titleKey,
  descriptionKey,
  descriptionVars,
}: {
  eyebrowKey?: MessageKey;
  titleKey: MessageKey;
  descriptionKey?: MessageKey;
  descriptionVars?: Record<string, string | number>;
}) {
  const t = useT();
  return (
    <PageBanner
      eyebrow={eyebrowKey ? t(eyebrowKey) : undefined}
      title={t(titleKey)}
      description={descriptionKey ? t(descriptionKey, descriptionVars) : undefined}
    />
  );
}
