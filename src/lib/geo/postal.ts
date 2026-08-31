export function normalizePostalCode(value: string): string {
  return value.replace(/\s+/g, "");
}

function isSwedishPostalCode(code: string): boolean {
  return /^\d{5}$/.test(code) && code !== "00000";
}

export function parsePostalCodes(raw: string): string[] {
  const codes = [...raw.matchAll(/\b(\d{3}\s?\d{2})\b/g)]
    .map((match) => normalizePostalCode(match[1] ?? ""))
    .filter(isSwedishPostalCode);
  return [...new Set(codes)];
}

export function extractPostalCode(...parts: Array<string | undefined>): string | undefined {
  const haystack = parts.filter((part) => part && part !== "00000").join(" ");
  const matches = haystack.matchAll(/\b(\d{3}\s?\d{2})\b/g);
  for (const match of matches) {
    const code = normalizePostalCode(match[1] ?? "");
    if (isSwedishPostalCode(code)) {
      return code;
    }
  }
  return undefined;
}

export function formatPostalCodes(codes: string[]): string {
  return [...new Set(codes.map(normalizePostalCode).filter(Boolean))].join("\n");
}
