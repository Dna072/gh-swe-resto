const TOKEN_KEY = "ghana-customer-token";

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getCustomerToken(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return sessionStorage.getItem(TOKEN_KEY) ?? "";
}

export function hasCustomerToken(): boolean {
  return getCustomerToken().length > 0;
}

export function subscribeCustomerToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setCustomerToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  notify();
}

export function clearCustomerToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  notify();
}

export function customerAuthHeaders(): HeadersInit {
  const token = getCustomerToken();
  return token ? { "X-Customer-Token": token } : {};
}

export async function customerFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getCustomerToken();
  if (token) {
    headers.set("X-Customer-Token", token);
    headers.delete("Authorization");
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, { ...init, headers });
  const payload = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? `Request failed (${response.status}).`);
  }
  return payload;
}
