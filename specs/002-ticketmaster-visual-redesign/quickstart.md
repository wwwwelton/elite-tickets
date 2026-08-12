# Quickstart Validation Guide

## Prerequisites

- PostgreSQL available through the existing Docker Compose setup.
- Backend environment configured with `DATABASE_URL`, `JWT_SECRET`, `QR_SECRET`, `TMDB_API_KEY`, and `CORS_ORIGINS`.
- Frontend environment configured with the API base URL variables already used by the project.

## Validation steps

1. Start the local stack with the existing Docker Compose workflow.
2. Confirm the backend health endpoints respond successfully.
3. Sign in as `ORGANIZER`.
4. Search the catalog with a keyword that returns Ticketmaster results.
5. Verify the normalized response shows title, image when present, category when present, and stable pagination metadata.
6. Open a result, select it, and create an event while setting:
   - `starts_at`
   - `venue`
   - `capacity`
   - `price`
7. Confirm the created event remains available after simulating an upstream outage.
8. Run the customer journey for a published event and confirm checkout, payment, ticket display, QR, and sharing still work.
9. Run the gate journey and confirm `VALID`, `INVALID`, `ALREADY_USED`, and `WRONG_EVENT` still render and behave as before.
10. Re-run the frontend build, lint, backend tests, and E2E flow tests.

## Expected outcomes

- Organizer searches use the new Ticketmaster-backed catalog contracts.
- The created event stores a snapshot of the external origin.
- Operational fields remain organizer-owned.
- Ticketmaster secrets never appear in the browser.
- Existing customer and gate flows remain functional.

## Test commands

- Frontend: `npm run build`, `npm run lint`, `npm run test`, `npm run test:e2e`
- Backend: existing pytest suites plus the new catalog-focused tests for mapping and failure handling

## References

- `contracts/catalog-api.md`
- `contracts/catalog-errors.md`
- `data-model.md`
