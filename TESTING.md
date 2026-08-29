# Testing

## Layers

| Layer | Tool | What |
| --- | --- | --- |
| Unit | Vitest | Pricing, promotions, inventory, state machine, RBAC, payments, delivery selection |
| Integration | Vitest + in-memory repos | Guest checkout, snapshots, concurrent last-portion |
| Rules | `@firebase/rules-unit-testing` + emulator | Customer/guest/admin/kitchen/finance isolation |
| E2E | Playwright | Phase 3+ customer and kitchen journeys |
| Load | k6 sketches in `tests/load` | Never against production |

## Commands

```bash
npm test                 # unit + in-memory integration
npm run test:rules       # starts Firestore emulator via firebase-tools
npm run test:all
```

Rules tests need Java 21.

## Coverage expected in Phase 0

- Weekday vs weekend price from restaurant calendar data
- Negative totals impossible
- Last tilapia portion cannot be sold twice
- Invalid order transitions rejected
- Duplicate payment webhooks ignored
- Unsigned webhooks rejected
- Guest cannot read another customer's data (rules)
- Customers cannot change totals, payment status, or inventory (rules)

## Later

Playwright mobile viewport (390px) for the guest journey and kitchen board. Load tests for menu, quote, create, kitchen, and tracking once HTTP APIs exist.
