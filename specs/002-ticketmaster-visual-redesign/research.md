# Research Notes: Catálogo Ticketmaster e evolução visual

## 1. Catalog integration

- Decision: Introduce a backend-only Ticketmaster Discovery API V2 client with isolated request/normalization logic.
- Rationale: The current adapter is already centralized and the feature requires hiding upstream credentials and shielding the rest of the app from Ticketmaster payload shape changes.
- Alternatives considered: Calling Ticketmaster directly from route handlers; forwarding raw Ticketmaster payloads to the frontend; expanding the current TMDb adapter in place.

## 2. Public catalog contract

- Decision: Expose EliteTickets-owned catalog endpoints that return normalized DTOs rather than the upstream response.
- Rationale: The frontend needs a stable contract, and the backend must own pagination, filtering, error semantics, and field availability rules.
- Alternatives considered: Proxying the upstream response; embedding Ticketmaster fields directly in event routes.

## 3. Snapshot persistence

- Decision: Persist the minimum external-origin snapshot needed to render and identify the event later, including the external identifier and display metadata.
- Rationale: Created events must remain functional during upstream outages and must not depend on a fresh catalog lookup.
- Alternatives considered: Storing only the external ID; re-fetching Ticketmaster on every render; duplicating the full upstream payload.

## 4. Failure handling

- Decision: Map upstream failures to explicit backend error classes and frontend states for timeout, 401, 429, 5xx, empty results, and optional-field absence.
- Rationale: The spec requires distinct user feedback and the backend must avoid leaking secrets or raw upstream errors.
- Alternatives considered: Collapsing errors into a single unavailable state; returning upstream status codes verbatim to the browser.

## 5. Frontend migration

- Decision: Rebuild the UI by first aligning tokens and shared primitives to DESIGN.md, then migrating route groups and feature screens in dependency order.
- Rationale: The project already has shared ticket-oriented UI primitives and the approved HTML artifacts emphasize structure, hierarchy, and composition that can be turned into reusable React components.
- Alternatives considered: Porting the HTML as static pages; redesigning page by page without shared primitives; starting with low-priority screens before core flows.

## 6. Test strategy

- Decision: Add backend tests for mapping, search, detail, timeout, 401, 429, 5xx, snapshot creation, and missing optional fields, while preserving existing E2E coverage for the main journeys.
- Rationale: The feature changes an external integration and a large part of the UI, so both contract-level and journey-level regressions matter.
- Alternatives considered: Relying only on manual UI checks; adding only unit tests; replacing existing E2E coverage.
