import type { ReactNode } from "react";
import { BottomNav } from "@/components/brand/bottom-nav";
import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import { cn } from "@/lib/utils";

export function CustomerShell({
  children,
  overlay = false,
}: {
  children: ReactNode;
  overlay?: boolean;
}) {
  return (
    <div className={cn("flex min-h-full flex-col pb-24 md:pb-0")}>
      <SiteHeader overlay={overlay} />
      {children}
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
