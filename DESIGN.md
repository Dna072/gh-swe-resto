# Design system

Phase 1 visual identity for Meridian Fusion Cuisine. Phase 2 uses these tokens on the customer homepage, menu, meal detail, and cart.

## Intent

A world-class digital Ghanaian food brand: contemporary, premium, mobile-first.

Reference market: [The Qave](https://theqave.se/) — do not copy it.

## Colour

| Token | Role |
| --- | --- |
| Charcoal / ink | Primary buttons, headlines |
| Parchment | Page background |
| Gold | Accent, prices sit in earth, decorative rules |
| Earth | Secondary emphasis, nav active, prices |
| Forest | Dietary / operational badges |
| Flag stripe | 4px accent, once per header — never a full theme |

Do not paint the UI red/yellow/green.

## Type

- **Great Vibes** — script eyebrows (“Welcome to”, “Discover”)
- **Fraunces** — headings
- **Outfit** — body and UI
- **Geist Mono** — order numbers

Minimum body size on mobile is 16px so iOS does not zoom inputs.

## Touch

Primary controls use `size="touch"` (44px). Bottom navigation is 56px tall plus safe-area.

## Motion

`src/lib/motion.ts` respects `prefers-reduced-motion`. Animation must never block add-to-cart.

Storefront motion is editorial: hero ken-burns, staggered fade-up, section reveal on scroll, image hover scale, gold underline on nav. Reduced-motion users get the same layout without travel or zoom.

## Components

shadcn/ui primitives live in `src/components/ui`. Brand wrappers live in `src/components/brand`.

Preview: `/design-system` (noindex).

## Photography

Food photography is a core restaurant asset. Production images are the restaurant’s own meals, uploaded by staff. Do **not** generate or ship AI food photographs.

Until a real photograph exists, use `FoodPhoto` / `PhotoComingSoon` — a parchment + kente placeholder with the meal name. Missing imagery must look intentional, never like a broken image.

Homepage hero, featured meals, and meal cards read image metadata from the backend (`url`, `altText`, focal point). Nothing is hard-coded in components.

## Language

Customer storefront is Swedish or English. Swedish is the default. The first visit reads `Accept-Language` and switches to English only when English ranks above Swedish. The visitor can override with SV / EN in the header and footer; the choice is stored in a `locale` cookie. Admin and kitchen stay English.

## Homepage

Editorial restaurant layout inspired by premium restaurant sites (Grand Restaurant–class rhythm, not a clone): full-viewport cinematic hero, hours strip, overlay signature plates, dotted-leader menu, full-bleed photo band, split story, categories, delivery check, reviews, visit/order CTA. Ghanaian identity is charcoal, gold, earth, and a single flag stripe — not a red/yellow/green theme.
