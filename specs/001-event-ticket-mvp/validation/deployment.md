# Local and Deployment Validation

Validated locally on 2026-08-11 with Docker Compose, PostgreSQL 17, Python 3.12,
Node.js 22, and Playwright Chromium.

## Fresh Compose environment

- Removed the EliteTickets Compose containers, network, and `postgres_data` volume.
- Rebuilt the API and web images from source and started the complete stack with
  `docker compose up --build -d --wait`.
- PostgreSQL, API, web, and expiry services became healthy; the one-shot migration
  service exited successfully.
- `/health/live`, `/health/ready`, and the frontend home returned success.
- `alembic current` reported `0004_ticket_shares (head)`.
- Running `python -m elite_tickets.seed_demo` twice retained exactly three demo users
  and one published demo event, with the same event ID.

The Compose image contexts exclude local environments, build output, test reports,
and dependency directories. Local defaults use distinct signing strings of at least
32 bytes and a non-empty demo-only TMDb placeholder; `.env` remains the required path
for real local credentials.

## Automated validation

```text
docker compose run --rm api pytest -q
52 passed in 2.12s

docker compose run --rm api pytest -m concurrency -v
8 passed, 44 deselected in 1.02s

docker compose run --rm web npm test
12 passed across 4 files

docker compose run --rm web npm run lint
exit 0

docker compose run --rm web npm run typecheck
exit 0

E2E_WEB_URL=http://localhost:3000 \
E2E_API_URL=http://localhost:8000/api/v1 \
./node_modules/.bin/playwright test --project=chromium
12 passed in 4.3s
```

The PostgreSQL concurrency selection explicitly includes reservation versus event
cancellation; approval, decline, and expiry versus cancellation; contention for the
last inventory unit; payment versus expiry; 100 simultaneous validations; and ticket
validation versus cancellation. The browser suite covers CUSTOMER purchase and refused
payment, ORGANIZER catalog/create/publish, GATE camera/manual/refusal behavior, sharing,
and the visual/accessibility checks.

## Expiry schedule

The local `expiry` service runs the idempotent command
`python -m elite_tickets.reservations.expire`, waits 60 seconds, and repeats. During this
validation its logs recorded 12 successful cycles, each reporting zero pending expirations.

Static inspection of `infra/render.yaml` confirmed the equivalent Render cron service:

```yaml
startCommand: python -m elite_tickets.reservations.expire
schedule: "* * * * *"
```

This is once per minute and uses the same API source and database configuration.

## Deployed smoke

Not executed: deployment/Vercel/Render access was not available. Per `quickstart.md`, this
does not block the complete local validation. HTTPS routing, deployed CORS, pre-deploy
migration logs, Render cron history, platform secret separation, frontend environment
exposure, and deployed shared-link headers remain deployment-environment smoke checks.
