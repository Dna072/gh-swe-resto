"use client";

import { useT } from "@/components/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

export function LocalizedCopy({
  messageKey,
  vars,
}: {
  messageKey: MessageKey;
  vars?: Record<string, string | number>;
}) {
  const t = useT();
  return <>{t(messageKey, vars)}</>;
}
