const SIGNED_KEY = "ghana-restaurant.marketing";
export const MARKETING_DISMISS_KEY = "ghana-restaurant.marketing-dismissed";

export function hasMarketingSignup(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(SIGNED_KEY) === "1";
}

export function rememberMarketingSignup(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SIGNED_KEY, "1");
}
