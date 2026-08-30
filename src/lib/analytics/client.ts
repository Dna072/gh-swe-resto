import type { AnalyticsEventName } from "@/domains/analytics/models";

const SESSION_KEY = "ghana-restaurant.session";

export function analyticsSessionId(): string {
  if (typeof window === "undefined") {
    return "ssr";
  }
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, created);
  return created;
}

export function track(
  name: AnalyticsEventName,
  properties: Record<string, string | number | boolean | null> = {},
): void {
  if (typeof window === "undefined") {
    return;
  }
  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      sessionId: analyticsSessionId(),
      properties: {
        path: window.location.pathname,
        referrer: document.referrer || null,
        locale: document.documentElement.lang || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...properties,
      },
    }),
    keepalive: true,
  }).catch(() => undefined);
}
