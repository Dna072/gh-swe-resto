"use client";

import { useT } from "@/components/i18n/locale-provider";
import { localizeReviewQuote } from "@/lib/i18n/catalog";

export function LocalizedReviewQuote({ id, fallback }: { id: string; fallback: string }) {
  const t = useT();
  return <>{localizeReviewQuote(id, fallback, t)}</>;
}
