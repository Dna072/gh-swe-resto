import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/brand/site-header";
import { BottomNav } from "@/components/brand/bottom-nav";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="pb-24 md:pb-8">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-xl px-4 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-earth">Coming in Phase 2+</p>
        <h1 className="mt-3 font-heading text-4xl">{title}</h1>
        <p className="mt-3 text-muted-foreground">This route exists so navigation can be tested. The product screen is not built yet.</p>
        <Button size="touch" className="mt-6" asChild>
          <Link href="/design-system">Back to design system</Link>
        </Button>
      </main>
      <BottomNav />
    </div>
  );
}
