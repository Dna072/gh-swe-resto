"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createTranslator, type Translator } from "@/lib/i18n/messages";
import { localeCookieHeader, localeHtmlLang, type Locale } from "@/lib/i18n/locales";

type LocaleContextValue = {
  locale: Locale;
  t: Translator;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale: initialLocale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const value = useMemo<LocaleContextValue>(() => {
    return {
      locale,
      t: createTranslator(locale),
      setLocale(next) {
        document.cookie = localeCookieHeader(next);
        document.documentElement.lang = localeHtmlLang(next);
        setLocaleState(next);
        router.refresh();
      },
    };
  }, [locale, router]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

export function useT(): Translator {
  return useLocale().t;
}

export function useOptionalT(): Translator {
  const context = useContext(LocaleContext);
  return context?.t ?? createTranslator("sv");
}
