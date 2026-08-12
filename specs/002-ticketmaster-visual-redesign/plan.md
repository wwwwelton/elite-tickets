# Implementation Plan: Catálogo Ticketmaster e evolução visual

**Branch**: `002-ticketmaster-visual-redesign` | **Date**: 2026-08-12 | **Spec**: `/home/avatar/elite-tickets/specs/002-ticketmaster-visual-redesign/spec.md`

**Input**: Feature specification from `/home/avatar/elite-tickets/specs/002-ticketmaster-visual-redesign/spec.md`

## Summary

Replace the current external catalog integration with a backend-only Ticketmaster Discovery API V2 adapter, expose stable EliteTickets catalog contracts to the frontend, and rebuild the frontend using the approved visual artifacts as the source of truth for layout and composition. Preserve organizer ownership of operational event fields and keep customer, gate, reservation, payment, QR, and sharing flows unchanged.

## Technical Context

**Language/Version**: TypeScript 5.9 on the frontend; Python 3.12 on the backend

**Primary Dependencies**: Next.js 15, React 19, FastAPI, Pydantic, SQLAlchemy, Alembic, httpx, PostgreSQL

**Storage**: PostgreSQL with SQLAlchemy models and Alembic migrations

**Testing**: Vitest and Playwright on the frontend; pytest on the backend

**Target Platform**: Linux containerized local development and browser-based web app

**Project Type**: Web application with separate frontend and backend apps

**Performance Goals**: Keep catalog searches responsive enough for interactive organizer use; preserve existing checkout and validation responsiveness

**Constraints**: Ticketmaster credentials stay backend-only; no changes to critical inventory, payment, QR, or gate rules; preserve existing role-based authorization; keep the UI aligned to DESIGN.md instead of generic dashboard patterns

**Scale/Scope**: Existing EliteTickets journeys across CUSTOMER, ORGANIZER, and GATE roles, plus a new external catalog integration and frontend redesign

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Fluxo principal ponta a ponta remains the priority across the feature.
- [x] Critical business rules remain enforced in the backend.
- [x] Role-based authorization remains backend-owned.
- [x] Inventory and ticket-consumption invariants remain atomic and non-negative.
- [x] Ticket QR validation remains non-predictable and single-use.
- [x] Critical behaviors are covered by automated tests.
- [x] The implementation stays simple and avoids unnecessary architecture.
- [x] The local stack remains Next.js + FastAPI + PostgreSQL + Docker Compose.
- [x] DESIGN.md stays the visual source of truth.
- [x] spec.md stays the functional source of truth.

## Project Structure

### Documentation (this feature)

```text
specs/002-ticketmaster-visual-redesign/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── catalog-api.md
    └── catalog-errors.md
```

### Source Code (repository root)

```text
apps/
├── api/
│   └── src/elite_tickets/
│       ├── catalog/
│       ├── events/
│       ├── reservations/
│       ├── tickets/
│       ├── auth/
│       ├── shared/
│       └── main.py
└── web/
    ├── app/
    ├── components/
    ├── lib/
    └── tests/
```

**Structure Decision**: Keep the existing split between `apps/api` and `apps/web`. Implement the Ticketmaster integration inside `apps/api/src/elite_tickets/catalog/` behind an internal catalog abstraction, then consume it through new EliteTickets API routes. Rebuild the frontend in `apps/web` using shared components and route-level pages, preserving the current app-router structure.

## Complexity Tracking

No constitution violations require justification.

## Phase 0: Research

### Decisions to resolve

- Use Ticketmaster Discovery API V2 as the upstream source, with backend-only authentication and response normalization.
- Expose EliteTickets-owned catalog contracts rather than forwarding raw Ticketmaster payloads.
- Persist an external-origin snapshot on event creation so created events remain usable during upstream outages.
- Rebuild the frontend around the existing app routes and shared components, guided by DESIGN.md and the approved HTML references.
- Preserve existing role flows and critical invariants without rewriting reservation, payment, QR, or gate logic.

### Research outputs

- `research.md` will record decisions, rationale, and alternatives for:
  - catalog abstraction shape;
  - search and detail endpoint contracts;
  - upstream error handling;
  - snapshot data model;
  - frontend migration order and component decomposition.

## Phase 1: Design & Contracts

### Data model scope

- Add an internal catalog DTO layer for normalized search/detail results.
- Extend the event snapshot model to store the external identifier and the minimum reusable metadata needed to render the event without requerying Ticketmaster.
- Keep the event's operational fields separate from the external snapshot: `starts_at`, `venue`, `capacity`, `available_quantity`, and `price` stay owned by EliteTickets.

### API contract scope

- Define stable EliteTickets catalog endpoints under `/api/v1/catalog/events` and `/api/v1/catalog/events/{external_id}`.
- Define catalog error semantics for timeout, 401, 429, 5xx, empty results, and missing optional fields.
- Keep upstream API keys server-side only and never surface them to the browser.

### Frontend migration scope

- Establish design tokens and global layout from DESIGN.md first.
- Build shared primitives and reused visual patterns next.
- Migrate event, checkout, ticket, organizer, create-event/catalog selector, and gate flows in that order.
- Add explicit loading, empty, and error states for the catalog and preserve the current customer/gate payment and validation journeys.

### Validation scope

- Backend tests will cover catalog search, detail, mapping, timeout, 401, 429, 5xx, snapshot creation, and missing optional fields.
- Frontend validation will keep build, lint, and existing E2E flows passing, with component tests added where the current infrastructure supports them.

## Phase 0 Deliverable

### `research.md`

Decision log for catalog integration, error handling, snapshotting, and frontend migration strategy.

## Phase 1 Deliverables

### `data-model.md`

Data and relationship model for Ticketmaster-originated catalog items and EliteTickets events.

### `contracts/catalog-api.md`

Request/response contract for the EliteTickets catalog endpoints.

### `contracts/catalog-errors.md`

Error-state contract for catalog search and detail failures.

### `quickstart.md`

Validation guide for the new catalog flow and the redesign verification steps.

## Re-check Constitution

The proposed design remains compliant: business rules stay backend-owned, the frontend remains presentation-only for catalog selection, credentials stay server-side, and the implementation avoids new architectural layers beyond the catalog abstraction required by the feature.
