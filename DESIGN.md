# Design system

Phase 1 visual identity for Ghana Restaurant. The customer homepage is not part of this phase.

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

- **Fraunces** — headings
- **Outfit** — body and UI
- **Geist Mono** — order numbers

Minimum body size on mobile is 16px so iOS does not zoom inputs.

## Touch

Primary controls use `size="touch"` (44px). Bottom navigation is 56px tall plus safe-area.

## Motion

`src/lib/motion.ts` respects `prefers-reduced-motion`. Animation must never block add-to-cart.

## Components

shadcn/ui primitives live in `src/components/ui`. Brand wrappers live in `src/components/brand`.

Preview: `/design-system` (noindex).
