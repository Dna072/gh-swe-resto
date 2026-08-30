export const LOCALES = ["sv", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "sv";
export const LOCALE_COOKIE = "locale";
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "sv" || value === "en";
}

/**
 * First supported tag in Accept-Language wins.
 * Unknown languages fall back to Swedish.
 */
export function detectLocaleFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header?.trim()) {
    return DEFAULT_LOCALE;
  }

  const ranked = header
    .split(",")
    .map((part) => {
      const [rawTag, ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { tag: (rawTag ?? "").trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (base === "sv") {
      return "sv";
    }
    if (base === "en") {
      return "en";
    }
  }

  return DEFAULT_LOCALE;
}

export function localeHtmlLang(locale: Locale): string {
  return locale === "en" ? "en" : "sv";
}

export function localeOpenGraph(locale: Locale): string {
  return locale === "en" ? "en_GB" : "sv_SE";
}

export function localeCookieHeader(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_MAX_AGE}; SameSite=Lax`;
}
