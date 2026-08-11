# US3 Validation — Online Gate Admission

Validated locally on 2026-08-11 against PostgreSQL 17 and Chromium.

## API, security, integration, and concurrency suites

```bash
cd apps/api
DATABASE_URL=<local-test-database> JWT_SECRET=<test-secret> QR_SECRET=<different-test-secret> \
  TMDB_API_KEY=test-key CORS_ORIGINS=http://localhost:3000 \
  uv run --extra test pytest -q \
  tests/unit/test_qr_credentials.py \
  tests/integration/test_gate_validation.py \
  tests/integration/test_organizer_events.py \
  tests/concurrency/test_ticket_validation.py \
  tests/concurrency/test_event_cancellation.py
```

Result: `21 passed in 1.12s`.

The suite proves fixed-algorithm signature verification, nonce hashing and tamper rejection;
GATE-only access; selection of published, unfinished events; all four explicit validation
results; attempt logging; and non-consumption for invalid, already-used, wrong-event,
cancelled, and finished cases. It also exercises cancellation against related domain
transitions.

The 100-request independent-session contention test produced exactly one `VALID` and 99
`ALREADY_USED` results with 100 audit rows. The cancellation race proves that a `VALID`
transaction cannot complete after cancellation and that every later validation is rejected
without changing `used_at`.

## Frontend validation

```bash
cd apps/web
npm run typecheck
npm run lint
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:9/api/v1 npm run build
```

Result: all commands exited `0`; Next.js generated the `/gate` route successfully.

## Chromium gate scenarios

With the frontend running locally and deterministic API/camera interception:

```bash
cd apps/web
E2E_WEB_URL=http://127.0.0.1:3000 \
  ./node_modules/.bin/playwright test tests/e2e/gate-validation.spec.ts
```

Result: `7 passed (3.9s)` using Playwright's default Chromium browser.

The browser suite proves camera/manual equivalence through the same online endpoint, denied
camera permission with manual fallback, distinct textual and semantic presentation of
`VALID`, `INVALID`, `ALREADY_USED`, and `WRONG_EVENT`, and explicit refusal of offline
admission when the backend cannot be reached.
