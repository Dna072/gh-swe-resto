import { emptyCart, readCart, writeCart } from "./storage";
import type { CartLine, PersistedCart } from "./types";

type Listener = () => void;

const listeners = new Set<Listener>();
const snapshots = new Map<string, { raw: string | null; cart: PersistedCart }>();

function rawValue(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("ghana-restaurant.cart.v1");
}

export function subscribeCart(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCartSnapshot(restaurantId: string): PersistedCart {
  const raw = rawValue();
  const cached = snapshots.get(restaurantId);
  if (cached && cached.raw === raw) {
    return cached.cart;
  }
  const cart = readCart(restaurantId);
  snapshots.set(restaurantId, { raw, cart });
  return cart;
}

const serverSnapshots = new Map<string, PersistedCart>();

export function getServerCartSnapshot(restaurantId: string): PersistedCart {
  const cached = serverSnapshots.get(restaurantId);
  if (cached) {
    return cached;
  }
  const empty = emptyCart(restaurantId);
  serverSnapshots.set(restaurantId, empty);
  return empty;
}

function emit(): void {
  snapshots.clear();
  listeners.forEach((listener) => listener());
}

export function persistCart(cart: PersistedCart): void {
  writeCart(cart);
  emit();
}

export function replaceLines(restaurantId: string, lines: CartLine[]): void {
  persistCart({ restaurantId, lines });
}
