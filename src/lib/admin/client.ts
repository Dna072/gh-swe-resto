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
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, { ...init, headers });
  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Admin request failed.");
  }
  return payload as T;
}
