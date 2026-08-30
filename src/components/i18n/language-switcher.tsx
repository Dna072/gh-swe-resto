"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

const options: Locale[] = ["sv", "en"];

export function LanguageSwitcher({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "muted";
}) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("a11y.language")}
      className={cn("inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.2em]", className)}
    >
      {options.map((option, index) => (
        <span key={option} className="inline-flex items-center gap-1">
          {index > 0 ? <span className="text-current/40">/</span> : null}
          <button
            type="button"
            aria-pressed={locale === option}
            onClick={() => setLocale(option)}
            className={cn(
              "min-h-9 min-w-9 px-1 transition-colors",
              locale === option
                ? "text-gold"
                : tone === "light"
                  ? "text-primary-foreground/65 hover:text-gold"
                  : "text-muted-foreground hover:text-gold",
            )}
          >
            {option === "sv" ? t("language.short.sv") : t("language.short.en")}
            <span className="sr-only">{option === "sv" ? t("language.sv") : t("language.en")}</span>
          </button>
        </span>
      ))}
    </div>
  );
}
