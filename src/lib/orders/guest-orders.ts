export type GuestOrderRef = {
  id: string;
  token: string;
  publicOrderNumber: string;
};

const KEY = "ghana-restaurant.guest-orders.v1";
export const EMPTY_GUEST_ORDERS: GuestOrderRef[] = [];

export function readGuestOrders(): GuestOrderRef[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as GuestOrderRef[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberGuestOrder(ref: GuestOrderRef): void {
  if (typeof window === "undefined") {
    return;
  }
  const next = [ref, ...readGuestOrders().filter((item) => item.id !== ref.id)].slice(0, 10);
  window.sessionStorage.setItem(KEY, JSON.stringify(next));
}

export function guestTokenFor(orderId: string): string | undefined {
  return readGuestOrders().find((item) => item.id === orderId)?.token;
}
