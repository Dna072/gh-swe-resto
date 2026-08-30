"use client";

import { useT } from "@/components/i18n/locale-provider";
import { localizeCategoryDescription, localizeCategoryName } from "@/lib/i18n/catalog";

export function LocalizedCategoryName({ id, fallback }: { id: string; fallback: string }) {
  const t = useT();
  return <>{localizeCategoryName(id, fallback, t)}</>;
}

export function LocalizedCategoryDescription({
  id,
  fallback,
  className,
}: {
  id: string;
  fallback?: string;
  className?: string;
}) {
  const t = useT();
  const description = localizeCategoryDescription(id, fallback, t);
  return description ? <p className={className}>{description}</p> : null;
}
