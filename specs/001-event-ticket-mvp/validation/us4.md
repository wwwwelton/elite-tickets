# US4 Validation — Read-Only Ticket Sharing

Validated locally on 2026-08-11 against PostgreSQL 17 and Chromium.

## API, security, and integration suites

```bash
cd apps/api
DATABASE_URL=<local-test-database> JWT_SECRET=<test-secret> QR_SECRET=<different-test-secret> \
  TMDB_API_KEY=test-key CORS_ORIGINS=http://localhost:3000 \
  uv run --extra test pytest -q \
  tests/unit/test_qr_credentials.py \
  tests/integration/test_gate_validation.py \
  tests/integration/test_ticket_sharing.py
```

Result: `12 passed in 0.56s`.

The suite proves 256-bit opaque share tokens backed only by unique SHA-256 hashes, stable
idempotent recovery, CUSTOMER ownership enforcement, and separation from the signed QR
credential. Submitting a share token at the gate returns `INVALID` without consuming the
ticket. Anonymous reads expose only the read-only ticket representation, never change
`owner_id`, and return `Cache-Control: no-store` plus `Referrer-Policy: no-referrer` for
successful, missing, used, and event-ended links. Both use and event end independently produce
the expired response.

Application and Uvicorn access logs redact `/shared/tickets/{token}`. Next.js suppresses its
framework request line for that sensitive route so the browser-facing token is not emitted by
either deployable unit.

## Frontend validation

```bash
cd apps/web
npm run typecheck
npm run lint
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:9/api/v1 npm run build
```

Result: all commands exited `0`; Next.js generated the dynamic shared-ticket route and applied
the response privacy headers.

## Chromium sharing journey

With FastAPI and Next.js running locally against the migrated database and demo seed:

```bash
cd apps/web
E2E_WEB_URL=http://127.0.0.1:3000 E2E_API_URL=http://127.0.0.1:8000/api/v1 \
  ./node_modules/.bin/playwright test tests/e2e/ticket-sharing.spec.ts
```

Result: `1 passed (2.3s)` using Playwright's default Chromium browser.

The journey purchased one ticket, created its share as the owner, opened it anonymously with
the QR and textual credential visible, confirmed the page privacy headers and absence of
management controls, consumed the QR through the GATE endpoint, and then observed the expired
page with no QR. Runtime log inspection confirmed that the full share token did not appear.
