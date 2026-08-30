import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Great_Vibes, Outfit } from "next/font/google";
import { Providers } from "@/app/providers";
import { SkipLink } from "@/components/brand/skip-link";
import { getEnv } from "@/lib/env";
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

export const metadata: Metadata = {
  title: "Ghana Restaurant Uppsala",
  description: "Authentic Ghanaian food delivered in Uppsala.",
  metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Ghana Restaurant Uppsala",
    description: "Authentic Ghanaian food delivered in Uppsala.",
    locale: "sv_SE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${outfit.variable} ${fraunces.variable} ${geistMono.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SkipLink />
        <Providers restaurantId={getEnv().DEFAULT_RESTAURANT_ID}>{children}</Providers>
      </body>
    </html>
  );
}
