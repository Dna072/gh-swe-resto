"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/client";
import type { AnalyticsEventName } from "@/domains/analytics/models";

export function TrackView({
  name,
  properties,
}: {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null>;
}) {
  useEffect(() => {
    track(name, properties ?? {});
    // Intentional: fire once per mount for this view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
  return null;
}
