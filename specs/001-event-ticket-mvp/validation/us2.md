# US2 Validation — Organizer Event Supply

Validated locally on 2026-08-11 against PostgreSQL 17 and Chromium.

## API and PostgreSQL suites

```bash
cd apps/api
DATABASE_URL=<local-test-database> JWT_SECRET=<test-secret> QR_SECRET=<different-test-secret> \
  TMDB_API_KEY=test-key CORS_ORIGINS=http://localhost:3000 \
  uv run --extra test pytest -q \
  tests/integration/test_catalog.py \
  tests/integration/test_organizer_events.py \
  tests/integration/test_public_events.py \
  tests/integration/test_purchase_flow.py \
  tests/concurrency/test_event_cancellation.py
```

Result: `24 passed in 0.94s`.

The suite proves TMDb normalization and bounded retry, 503 without partial persistence,
immutable saved snapshots, owner-only lifecycle operations, DRAFT publication, temporal
finishing, atomic cancellation, continued public/purchase behavior from snapshots, and
cancellation races against reservation, approval, decline, and expiration. Final states keep
inventory non-negative and bounded, release reservations exactly once, and leave no active
ticket after cancellation.

## Frontend validation

```bash
cd apps/web
npm run typecheck
npm run lint
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:9/api/v1 npm run build
```

Result: all commands exited `0`; Next.js generated the organizer ledger and creation routes.

## Chromium journey

With the frontend running locally and deterministic API interception:

```bash
cd apps/web
E2E_WEB_URL=http://127.0.0.1:3000 \
  ./node_modules/.bin/playwright test tests/e2e/organizer-events.spec.ts
```

Result: `1 passed (3.2s)` using Playwright's default Chromium browser.

The journey authenticated an ORGANIZER, displayed a retryable TMDb 503, retried successfully,
used the missing-poster fallback, created a DRAFT with validated fields, returned to the owned
ledger, and published the event.
