/**
 * Load-test sketches for later phases. Do not run against production.
 *
 * Scenarios to add when HTTP APIs exist:
 * - menu browsing
 * - cart quote
 * - checkout quote
 * - order creation
 * - kitchen board polling (not unbounded listeners)
 * - order tracking
 */
export const options = {
  vus: 1,
  duration: "1s",
};

export default function () {
  // Intentionally empty in Phase 0.
}
