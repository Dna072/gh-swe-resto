import { getEnv } from "@/lib/env";

const DEFAULT_PUBLIC_HOST = "mfcuisine.se";
const DEFAULT_ADMIN_HOST = "admin.mfcuisine.se";
const DEFAULT_KITCHEN_HOST = "kitchen.mfcuisine.se";

function stripPort(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

export function publicAppHost(): string {
  return getEnv().PUBLIC_APP_HOST ?? DEFAULT_PUBLIC_HOST;
}

export function adminAppHost(): string {
  return getEnv().ADMIN_APP_HOST ?? DEFAULT_ADMIN_HOST;
}

export function kitchenAppHost(): string {
  return getEnv().KITCHEN_APP_HOST ?? DEFAULT_KITCHEN_HOST;
}

export function isAdminAppHost(host: string): boolean {
  const normalized = stripPort(host);
  const configured = adminAppHost().toLowerCase();
  return normalized === configured || normalized === "admin.localhost";
}

export function isKitchenAppHost(host: string): boolean {
  const normalized = stripPort(host);
  const configured = kitchenAppHost().toLowerCase();
  return normalized === configured || normalized === "kitchen.localhost";
}

export function isPublicAppHost(host: string): boolean {
  const normalized = stripPort(host);
  const configured = publicAppHost().toLowerCase();
  return (
    normalized === configured ||
    normalized === `www.${configured}` ||
    normalized === "localhost" ||
    normalized === "127.0.0.1"
  );
}

export function originForHost(host: string, protocol = "https"): string {
  const normalized = stripPort(host);
  if (normalized === "localhost" || normalized.endsWith(".localhost") || normalized === "127.0.0.1") {
    return `http://${normalized}:3000`;
  }
  return `${protocol}://${normalized}`;
}

export function storefrontOrigin(): string {
  const env = getEnv();
  if (env.APP_BASE_URL) {
    return env.APP_BASE_URL.replace(/\/$/, "");
  }
  return originForHost(publicAppHost());
}

export function adminOrigin(): string {
  const env = getEnv();
  if (env.ADMIN_APP_BASE_URL) {
    return env.ADMIN_APP_BASE_URL.replace(/\/$/, "");
  }
  return originForHost(adminAppHost());
}

export function kitchenOrigin(): string {
  const env = getEnv();
  if (env.KITCHEN_APP_BASE_URL) {
    return env.KITCHEN_APP_BASE_URL.replace(/\/$/, "");
  }
  return originForHost(kitchenAppHost());
}

export function staffContinueUrl(role: string): string {
  if (role === "KITCHEN") {
    return `${kitchenOrigin()}/kitchen`;
  }
  return `${adminOrigin()}/admin`;
}
