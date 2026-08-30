import type { Metadata } from "next";
import Link from "next/link";
import { AdminSession } from "@/components/admin/admin-session";

export const metadata: Metadata = {
  title: "Kitchen",
  robots: { index: false, follow: false },
};

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/kitchen" className="font-heading text-lg">
            Kitchen
          </Link>
          <nav aria-label="Kitchen" className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin/orders" className="hover:text-earth">
              Orders
            </Link>
            <Link href="/admin/menu" className="hover:text-earth">
              Menu
            </Link>
            <Link href="/" className="hover:text-earth">
              Storefront
            </Link>
          </nav>
        </div>
      </header>
      <AdminSession />
      {children}
    </div>
  );
}
