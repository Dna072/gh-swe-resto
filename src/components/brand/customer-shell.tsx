import type { ReactNode } from "react";
import { BottomNav } from "@/components/brand/bottom-nav";
import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";

export function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col pb-24 md:pb-0">
      <SiteHeader />
      {children}
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
