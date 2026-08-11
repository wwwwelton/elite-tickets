# Security Validation

Validated locally on 2026-08-11. This review covers dependency advisories, tracked source,
production build artifacts, and runtime request logging. It does not claim access to deployed
Render or Vercel secrets.

## Dependency advisories

```bash
cd apps/web
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=moderate
```

Result: both runtime-only and complete dependency audits reported `found 0 vulnerabilities`.

```bash
UV_CACHE_DIR=/tmp/elite-tickets-uv-cache \
  uvx pip-audit --path apps/api/.venv/lib/python3.12/site-packages --progress-spinner off
```

Result: `No known vulnerabilities found`. `elite-tickets-api 0.1.0` was listed as skipped
because it is the local application package and does not exist on PyPI; its resolved third-party
environment was audited.

## Source and artifact inspection

The tracked tree and the generated Next.js `.next` output were scanned for private-key headers,
common cloud/provider token prefixes, embedded database credentials, and concrete JWT, QR, and
TMDb secret assignments. No production secret or private key was found. The browser bundle does
not contain the demo password, database URL, test signing secrets, or backend secret variable
values.

The API was packaged with:

```bash
UV_CACHE_DIR=/tmp/elite-tickets-uv-cache uv build --project apps/api
```

The production wheel contains the intentionally public local-demo password used by
`seed_demo.py`, but no database, JWT, QR, or TMDb credential. The source distribution includes
tests and therefore their explicit fake signing values; these are fixed non-production fixtures,
not operational secrets. `.env.example` contains placeholders only and is the sole tracked env
file.

## Sensitive request logging

Integration and live Chromium runs exercised JWT authentication, QR validation, and ticket-share
URLs. Application logs redact bearer/JWS/named secret values and replace the public share token
path segment with `<redacted>`. A Uvicorn access-log filter performs the same replacement before
request-line interpolation. Next.js suppresses framework request lines for
`/shared/tickets/{shareToken}` while still serving that route with `Cache-Control: no-store` and
`Referrer-Policy: no-referrer`.

Runtime inspection confirmed that full JWTs, QR credentials, share tokens, passwords, TMDb keys,
and database URLs were absent from emitted application/access logs. The deliberately public demo
email/password and simulated payment tokens remain documented for local evaluation only.

## Result

PASS for the local MVP scope: dependency checks are clean, no real secret is committed or bundled,
sensitive URL/token logging is redacted or suppressed, JWT and QR secrets remain distinct runtime
inputs, and public share responses disable caching and referrer propagation.
