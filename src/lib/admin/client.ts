const TOKEN_KEY = "ghana-admin-token";

const listeners = new Set<() => void>();

function notifyAdminTokenListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getAdminToken(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return sessionStorage.getItem(TOKEN_KEY) ?? "";
}

export function hasAdminToken(): boolean {
  return getAdminToken().length > 0;
}

export function subscribeAdminToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  notifyAdminTokenListeners();
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  notifyAdminTokenListeners();
}

export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  if (!token) {
    throw new Error("Paste the admin token at the top and click Use token first.");
  }
  const headers = new Headers(init.headers);
  // Cloud Run treats Authorization as a Google identity token. A showcase
  // admin secret there gets a Google 401 before Next.js runs. Use a custom header.
  headers.set("X-Admin-Token", token);
  headers.delete("Authorization");
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, { ...init, headers });
  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? `Request failed (${response.status}).`);
  }
  return payload as T;
}
