# Frontend Refactor Validation Quickstart

## Prerequisites

- Node.js 22+ and npm installed, or Docker Compose running the project.
- PostgreSQL/API available with demo seed data for authenticated journeys.
- `NEXT_PUBLIC_API_BASE_URL` and, for server rendering, `API_INTERNAL_BASE_URL`
  configured as in the repository README.

## Local validation

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

## Browser journeys

With API on `http://localhost:8000` and web on `http://localhost:3000`:

```bash
cd apps/web
E2E_WEB_URL=http://localhost:3000 \
E2E_API_URL=http://localhost:8000/api/v1 \
npm run test:e2e -- --project=chromium
```

Exercise or verify:

1. Customer: home → event detail → quantity/reservation → approved and declined
   checkout → My Tickets → ticket detail/QR/share.
2. Organizer: login → event list → catalog selection → create draft → publish.
3. Gate: login → event selection → manual validation and camera fallback → all
   four result states.
4. Accessibility: keyboard-only focus/order, labels, live feedback, and no
   horizontal overflow at mobile, intermediate, and desktop widths.

## Expected outcomes

- All dynamic values come from the existing API/state layer.
- Routes and backend contracts are unchanged.
- Each paired reference is one responsive implementation.
- Loading, empty, error, success, declined, expired, validation, and fallback
  states remain reachable and understandable.
- No file under `docs/design/` is modified.
