/** Public restaurant copy for chrome. Hours are display-only — not pricing rules. */
export const restaurantDisplay = {
  name: "Meridian Fusion Cuisine",
  mark: "Meridian",
  markLine: "Fusion Cuisine",
  city: "Uppsala",
  addressLine: "Kungsängsgatan 1",
  postalLine: "75322 Uppsala",
  address: "Kungsängsgatan 1, 75322 Uppsala",
  hours: [
    { label: "Kitchen", days: "Monday to Sunday", time: "11.00 – 19.00" },
    { label: "Delivery", days: "Monday to Sunday", time: "11.00 – 19.00" },
  ],
} as const;
