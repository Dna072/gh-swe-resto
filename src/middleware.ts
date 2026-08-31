import { NextResponse, type NextRequest } from "next/server";
import {
  detectLocaleFromAcceptLanguage,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
} from "@/lib/i18n/locales";
import { isAdminAppHost, isKitchenAppHost } from "@/lib/brand/hosts";

function applyLocaleCookie(request: NextRequest, response: NextResponse): NextResponse {
  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(existing)) {
    return response;
  }
  const locale = detectLocaleFromAcceptLanguage(request.headers.get("accept-language"));
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_MAX_AGE,
    sameSite: "lax",
  });
  return response;
}

function isPassthroughPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/brand") ||
    pathname === "/favicon.ico"
  );
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  if (!isPassthroughPath(pathname)) {
    if (isAdminAppHost(host) && !pathname.startsWith("/admin") && !pathname.startsWith("/kitchen")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
      return applyLocaleCookie(request, NextResponse.rewrite(url));
    }
    if (isKitchenAppHost(host) && !pathname.startsWith("/kitchen") && !pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/kitchen";
      return applyLocaleCookie(request, NextResponse.rewrite(url));
    }
  }

  return applyLocaleCookie(request, NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/|api/).*)"],
};
