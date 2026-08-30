import { cookies, headers } from "next/headers";
import { detectLocaleFromAcceptLanguage, isLocale, LOCALE_COOKIE, type Locale } from "./locales";
import { createTranslator, type Translator } from "./messages";

export async function getLocale(): Promise<Locale> {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(stored)) {
    return stored;
  }
  return detectLocaleFromAcceptLanguage((await headers()).get("accept-language"));
}

export async function getTranslator(): Promise<Translator> {
  return createTranslator(await getLocale());
}
