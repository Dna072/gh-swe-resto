import { getEnv } from "@/lib/env";

/** Firebase hosted action links need a web API key; Admin SDK sometimes omits it. */
export function ensureFirebaseActionApiKey(link: string): string {
  const apiKey = getEnv().FIREBASE_WEB_API_KEY ?? getEnv().NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    return link;
  }
  try {
    const url = new URL(link);
    if (!url.searchParams.get("apiKey")) {
      url.searchParams.set("apiKey", apiKey);
    }
    return url.toString();
  } catch {
    return link;
  }
}

export function isFirebaseAuthConfigError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
  return (
    message.includes("There is no configuration corresponding to the provided identifier") ||
    message.includes("CONFIGURATION_NOT_FOUND") ||
    code.includes("configuration-not-found") ||
    code.includes("auth/configuration-not-found")
  );
}
