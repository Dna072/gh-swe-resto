const STOCKHOLM = "Europe/Stockholm";

export function formatSlot(iso: string | undefined, locale: "sv" | "en" = "sv"): string {
  if (!iso) {
    return "";
  }
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "sv-SE", {
    timeZone: STOCKHOLM,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(at);
}
