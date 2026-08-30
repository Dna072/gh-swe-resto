import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Great_Vibes, Outfit } from "next/font/google";
import { Providers } from "@/app/providers";
import { SkipLink } from "@/components/brand/skip-link";
import { getEnv } from "@/lib/env";
import { getLocale, getTranslator } from "@/lib/i18n/server";
import { localeHtmlLang, localeOpenGraph } from "@/lib/i18n/locales";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  const locale = await getLocale();
  return {
    title: t("meta.siteTitle"),
    description: t("meta.siteDescription"),
    metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
    openGraph: {
      title: t("meta.siteTitle"),
      description: t("meta.siteDescription"),
      locale: localeOpenGraph(locale),
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const t = await getTranslator();
  return (
    <html
      lang={localeHtmlLang(locale)}
      className={`${outfit.variable} ${fraunces.variable} ${geistMono.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SkipLink label={t("a11y.skip")} />
        <Providers restaurantId={getEnv().DEFAULT_RESTAURANT_ID} locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
