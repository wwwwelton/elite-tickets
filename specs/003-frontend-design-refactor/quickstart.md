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
and all four results; ticket QR/share; keyboard/focus/accessibility review;
shared login visibility; logout; role-aware navigation; protected-route denial
states; and direct Gate entry to event selection after sign-in.

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
validation error, auth required, access denied, authorization redirect, success,
approved, declined, expired, VALID, INVALID, ALREADY_USED, WRONG_EVENT, and
camera failure with manual fallback.

Latest local validation:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test` passed (25 files, 55 tests).
- `npm run build` passed.
- Playwright suites were attempted against a live local stack started with
  `docker compose up --build -d --wait`, but Chromium failed to launch in this
  sandbox with `sandbox_host_linux.cc:41` (`Operation not permitted`) before the
  tests could execute.

Local stack status during the last validation attempt:

- `docker compose up --build -d --wait` completed successfully.
- API and web services reached healthy status.
- Browser automation is currently blocked by the sandboxed Chromium launch
  restriction, not by an application error in the feature itself.

Legacy cleanup audit: all selectors in `apps/web/app/globals.css` are referenced
by current app/components; no obsolete CSS or component file was removed because
there was no proven-unused implementation to delete.
