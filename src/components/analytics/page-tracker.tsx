"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/client";

const SKIP = ["/admin", "/kitchen", "/api"];

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || SKIP.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return;
    }
    track("page_viewed", { path: pathname });
  }, [pathname]);

  return null;
}
