export type GuestOrderRef = {
  id: string;
  token: string;
  publicOrderNumber: string;
};

const KEY = "ghana-restaurant.guest-orders.v1";
export const EMPTY_GUEST_ORDERS: GuestOrderRef[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedValue: GuestOrderRef[] = EMPTY_GUEST_ORDERS;

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeGuestOrders(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readGuestOrders(): GuestOrderRef[] {
  if (typeof window === "undefined") {
    return EMPTY_GUEST_ORDERS;
  }
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw === cachedRaw) {
      return cachedValue;
    }
    if (!raw) {
      cachedRaw = raw;
      cachedValue = EMPTY_GUEST_ORDERS;
      return EMPTY_GUEST_ORDERS;
    }
    const parsed = JSON.parse(raw) as GuestOrderRef[];
    cachedRaw = raw;
    cachedValue = Array.isArray(parsed) ? parsed : EMPTY_GUEST_ORDERS;
    return cachedValue;
  } catch {
    return EMPTY_GUEST_ORDERS;
  }
}

export function rememberGuestOrder(ref: GuestOrderRef): void {
  if (typeof window === "undefined") {
    return;
  }
  const next = [ref, ...readGuestOrders().filter((item) => item.id !== ref.id)].slice(0, 10);
  const raw = JSON.stringify(next);
  window.sessionStorage.setItem(KEY, raw);
  cachedRaw = raw;
  cachedValue = next;
  emit();
}

export function guestTokenFor(orderId: string): string | undefined {
  return readGuestOrders().find((item) => item.id === orderId)?.token;
}
