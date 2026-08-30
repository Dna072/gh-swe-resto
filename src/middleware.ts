import { NextResponse, type NextRequest } from "next/server";
import {
  detectLocaleFromAcceptLanguage,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
} from "@/lib/i18n/locales";

export function middleware(request: NextRequest) {
  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(existing)) {
    return NextResponse.next();
  }

  const locale = detectLocaleFromAcceptLanguage(request.headers.get("accept-language"));
  const response = NextResponse.next();
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_MAX_AGE,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/|api/).*)"],
};
