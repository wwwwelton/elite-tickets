# US1 Validation — Customer Purchase and Ticket Issuance

Validated locally on 2026-08-10 against PostgreSQL 17 and Chromium.

## API, unit, and PostgreSQL concurrency suites

```bash
cd apps/api
DATABASE_URL=<local-test-database> JWT_SECRET=<test-secret> QR_SECRET=<different-test-secret> \
  TMDB_API_KEY=test-key CORS_ORIGINS=http://localhost:3000 \
  uv run --extra test pytest -q \
  tests/integration/test_authorization.py \
  tests/integration/test_public_events.py \
  tests/integration/test_purchase_flow.py \
  tests/integration/test_reservation_expiry.py \
  tests/unit/test_qr_credentials.py \
  tests/concurrency/test_inventory.py
```

Result: `27 passed in 1.36s`.

This includes anonymous discovery, authorization and ownership, approved and declined payments,
payload-bound idempotency, exact ticket issuance, expiration and no-double-release behavior,
last-unit contention, payment-versus-expiry races, and QR credential security.

## Expiry runner

```bash
cd apps/api
DATABASE_URL=<local-test-database> JWT_SECRET=<test-secret> QR_SECRET=<different-test-secret> \
  TMDB_API_KEY=test-key CORS_ORIGINS=http://localhost:3000 \
  uv run python -m elite_tickets.reservations.expire
```

Result: exit code `0`; `Expired reservations: 0` on an already-clean database.

## Frontend validation

```bash
cd apps/web
npm run typecheck
npm run lint
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:9/api/v1 npm run build
```

Result: all commands exited `0`; Next.js compiled and generated all US1 routes successfully.

## Chromium journey

With the API and web application running locally against the idempotent demo seed:

```bash
cd apps/web
E2E_WEB_URL=http://127.0.0.1:3000 \
  ./node_modules/.bin/playwright test tests/e2e/customer-purchase.spec.ts
```

Result: `1 passed (5.1s)` using Playwright's default Chromium browser.

The browser flow discovered the seeded event, authenticated the CUSTOMER, approved a two-unit
purchase, observed exactly two additional tickets, declined a separate reservation, verified
explicit terminal refusal with no retry controls, confirmed restored availability, and confirmed
that the decline issued no additional ticket.
