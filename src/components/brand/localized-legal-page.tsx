"use client";

import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";
import { useT } from "@/components/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

export function LocalizedLegalPage({
  eyebrowKey,
  titleKey,
  bodyKeys,
}: {
  eyebrowKey: MessageKey;
  titleKey: MessageKey;
  bodyKeys: MessageKey[];
}) {
  const t = useT();
  return (
    <CustomerShell>
      <main id="main">
        <PageBanner eyebrow={t(eyebrowKey)} title={t(titleKey)} />
        <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
          <div className="space-y-4 text-muted-foreground">
            {bodyKeys.map((key) => (
              <p key={key}>{t(key)}</p>
            ))}
          </div>
        </div>
      </main>
    </CustomerShell>
  );
}
