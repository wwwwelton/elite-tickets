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
