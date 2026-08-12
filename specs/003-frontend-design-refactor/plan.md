# Implementation Plan: Frontend Design Refactor

**Branch**: `003-frontend-design-refactor` | **Date**: 2026-08-12 | **Spec**: [spec.md](spec.md)

## Summary

Refactor the existing Next.js/React frontend to implement the 23 approved design
references as 15 route/interaction flows, without changing backend contracts,
domain behavior, routes, or `docs/design/`. Screenshots are the visual target;
HTML files provide composition guidance. Existing API/state values remain dynamic.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19, Node.js 22+

**Primary Dependencies**: Next.js 15 App Router, React 19, existing CSS in `app/globals.css`, QRCode package

**Storage**: N/A for this UI-only change; existing FastAPI/PostgreSQL data remains authoritative

**Testing**: Vitest + Testing Library, Playwright, ESLint, `tsc --noEmit`, Next production build

**Target Platform**: Browser, responsive mobile and desktop viewports, served by existing Next.js container

**Project Type**: Web application frontend

**Performance Goals**: Preserve current route/build performance; avoid adding client bundles or dependencies without evidence

**Constraints**: Preserve routes, API contracts, JWT role guards, inventory/payment/QR behavior, keyboard access, and no horizontal overflow on primary content

**Scale/Scope**: 46 reference files (23 `code.html` + 23 `screen.png`) across 15 design directories, 12 existing App Router route files, shared UI/event/ticket components

## Constitution Check

- I, II, III, IV, V, VI, VII, VIII: PASS — presentation-only work; backend authorization, inventory, payment, and QR rules remain untouched.
- IX: PASS — reuse existing primitives and CSS; no new abstraction or dependency without repeated usage.
- X, XI, XII: PASS — existing Docker/demo configuration and secrets remain unchanged.
- XIV, XV: PASS — `DESIGN.md` and approved screenshots govern visual decisions; no generic dashboard language.
- XVI, XVII, XVIII: PASS — behavior follows `spec.md`, this plan records technical decisions, and all changes require tests/build review.

## Design inventory and mapping

The 23 `code.html`/`screen.png` assets map to the 15 flows listed in `spec.md`:
customer home, event detail, checkout, approved/declined checkout states, ticket
list/detail/shared ticket, organizer list/create, gate scanner, and four gate
result states. Seven pairs are responsive variants: home, event detail, checkout,
my tickets, ticket detail, organizer events, create event, plus gate scanner's
desktop counterpart (the spec's paired-flow rule applies to each available pair).
Payment and gate results remain post-action component states in their existing
routes, not new routes. Any copy, artwork, price, date, or count in references is
placeholder content and is replaced by the existing view models/API responses.

## Existing architecture and reuse strategy

- Keep App Router route files under `apps/web/app/**` and the existing server/client
  boundaries. Pages continue to fetch server-safe data where they do so today;
  interactive components remain client components.
- Keep `apps/web/lib/api.ts` as the sole normalized HTTP/error boundary and
  `apps/web/lib/auth.ts` as the session/role guard boundary.
- Extend/refine existing primitives (`Button`, `Ticket`, `Status`, `LedgerRow`,
  `Perforation`) and event/ticket components before changing page composition.
- Share poster, ticket frame, ledger rows, status messaging, form fields, and
  responsive shell patterns. Do not create separate mobile/desktop business
  components.
- Preserve existing scanner, checkout, countdown, quantity, sharing, and QR logic;
  change only hierarchy, semantics, and styling around them.

## Responsive implementation

Implement one CSS-responsive flow per paired reference. Use the existing tokenized
CSS and media-query conventions in `globals.css`; derive column changes, spacing,
full-width mobile actions, and dense desktop ledgers from screenshots. Validate at
reference mobile/desktop sizes plus an intermediate width. Primary content must not
overflow horizontally.

## Data and state binding

Map reference placeholders to existing `PublicEvent`, catalog result, reservation,
payment, ticket, session, organizer event, and gate validation types. Keep loading,
empty, network/API, validation, authorization, success, declined, expired, and
camera-denied states explicit in components. Never embed design mock values or alter
the backend/API shape to fit a screenshot.

## Accessibility and interaction

Use semantic landmarks/headings, associated labels, accessible names, visible
`:focus-visible`, live status/alert regions, text plus non-color status indicators,
and keyboard-operable controls. If a dialog is not present in the existing flow,
do not introduce one solely for visual matching. Preserve camera failure/manual QR
fallback and focus feedback after validation/share actions.

## Validation strategy

1. Run unit tests for primitives, login, public pages, checkout states, ticket/QR/share semantics.
2. Run Playwright customer purchase, organizer create/publish, gate outcomes, ticket sharing, and accessibility suites at mobile and desktop projects.
3. Run lint, typecheck, and production build after each migration slice and finally across `apps/web`.
4. Review each screenshot mapping manually at the documented viewport sizes; record any intentional discrepancy in implementation notes rather than changing product behavior.

## Project Structure

```text
apps/web/
├── app/                         # Existing App Router routes and global CSS
├── components/
│   ├── ui/                      # Shared visual primitives
│   ├── auth/                    # Login form
│   ├── events/                  # Discovery, detail, organizer, catalog form
│   ├── checkout/                # Reservation/payment states
│   └── tickets/                 # Ticket, QR, sharing, gate scanner/results
├── lib/                         # API client and JWT/session guards
└── tests/
    ├── unit/                    # Vitest/Testing Library
    └── e2e/                     # Playwright journeys/accessibility
```

**Structure Decision**: retain the existing Next.js App Router structure and
component folders; this feature adds no backend, route, or persistent data layer.

## Delivery phases

1. Inventory/tokens and shared shell/primitives.
2. Customer discovery/detail, checkout, ticket list/detail/share.
3. Organizer list/create/catalog states.
4. Gate scanner and result states.
5. Accessibility/responsive audit, legacy cleanup, E2E and final validation.

## Complexity Tracking

No constitution violations or new architectural complexity are proposed.
