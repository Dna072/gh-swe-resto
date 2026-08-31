import type { Metadata } from "next";
import Link from "next/link";
import { AdminSession } from "@/components/admin/admin-session";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="font-heading text-lg">
            Kitchen admin
          </Link>
          <nav aria-label="Admin" className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/kitchen" className="hover:text-earth">
              Kitchen
            </Link>
            <Link href="/admin/orders" className="hover:text-earth">
              Orders
            </Link>
            <Link href="/admin/menu" className="hover:text-earth">
              Meals
            </Link>
            <Link href="/admin/homepage" className="hover:text-earth">
              Homepage
            </Link>
            <Link href="/admin/analytics" className="hover:text-earth">
              Analytics
            </Link>
            <Link href="/admin/delivery" className="hover:text-earth">
              Delivery
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
