import Link from "next/link";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { FirstOwnerSetup } from "@/components/admin/first-owner-setup";
import { SeedCatalogButton } from "@/components/admin/seed-catalog-button";
import { Button } from "@/components/ui/button";

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-earth">Admin</p>
        <h1 className="mt-2 font-heading text-4xl">Kitchen, visitors, and sales</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Watch who visits the storefront, where they come from, and what they do —
          then follow paid sales. Set delivery postcodes under Delivery so guests in
          those areas can order. Upload real kitchen photographs only.
        </p>
      </div>
      <FirstOwnerSetup />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="touch" asChild>
          <Link href="/kitchen">Kitchen board</Link>
        </Button>
        <Button size="touch" variant="outline" asChild>
          <Link href="/admin/orders">Orders</Link>
        </Button>
        <Button size="touch" variant="outline" asChild>
          <Link href="/admin/menu">Meals</Link>
        </Button>
        <Button size="touch" variant="outline" asChild>
          <Link href="/admin/homepage">Homepage</Link>
        </Button>
        <Button size="touch" variant="outline" asChild>
          <Link href="/admin/analytics">Full analytics</Link>
        </Button>
        <Button size="touch" variant="outline" asChild>
          <Link href="/admin/delivery">Delivery areas</Link>
        </Button>
        <Button size="touch" variant="outline" asChild>
          <Link href="/admin/promotions">Promotions</Link>
        </Button>
        <Button size="touch" variant="outline" asChild>
          <Link href="/admin/settings">Settings</Link>
        </Button>
      </div>
      <AnalyticsDashboard />
      <SeedCatalogButton />
    </main>
  );
}
