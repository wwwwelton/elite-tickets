# Frontend Refactor Validation Quickstart

## Prerequisites

- Node.js 22+ and npm, or the existing Docker Compose stack.
- PostgreSQL/API with demo seed data for authenticated journeys.
- Existing `NEXT_PUBLIC_API_BASE_URL` and `API_INTERNAL_BASE_URL` configuration.

## Baseline and final commands

```bash
docker compose up --build -d --wait
docker compose run --rm api alembic upgrade head
docker compose run --rm api python -m elite_tickets.seed_demo

cd apps/web
npm run lint
npm run typecheck
npm run test
npm run build
```

## Browser validation

```bash
cd apps/web
E2E_WEB_URL=http://localhost:3000 \
E2E_API_URL=http://localhost:8000/api/v1 \
npm run test:e2e -- --project=chromium
```

Review all 15 mapped flows in a matrix at reference mobile, intermediate, and
desktop widths. The matrix records each of the eight responsive pairs and seven
standalone states. A blocking mismatch is a missing flow/state, broken primary
interaction, wrong product behavior, unreadable content, or primary-content
horizontal overflow.

Required journeys: Customer purchase with approved/declined payment; Organizer
catalog selection, draft, and publish; Gate selection, camera/manual fallback,
and all four results; ticket QR/share; keyboard/focus/accessibility review.

Expected outcome: routes, API contracts, JWT/session behavior, authorization,
business rules, and dynamic values remain unchanged; no file under `docs/design/`
is modified.

## Responsive/state matrix

| Pair | Mobile | Intermediate (640–1023px) | Desktop |
|---|---|---|---|
| Home, Event Detail, Checkout | single-column primary flow | fluid two-column where space allows | editorial split layout |
| My Tickets, Ticket Detail | stacked ticket content | constrained readable card | expanded ticket/card composition |
| Organizer Events, Create Event | stacked controls | fluid form and ledger | two-column workspace |
| Gate Scanner | manual-first fallback | readable scanner/manual split | scanner and manual panels |

Nominal states covered by the existing flows: loading, empty, API/network error,
validation error, authorization redirect, success, approved, declined, expired,
VALID, INVALID, ALREADY_USED, WRONG_EVENT, and camera failure with manual fallback.

Latest local validation: `npm run lint`, `npm run typecheck`, `npm run test`
(12 files, 32 tests), and `npm run build` passed.
