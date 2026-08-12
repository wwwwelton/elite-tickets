# Implementation Plan: Frontend Design Refactor

**Branch**: `003-frontend-design-refactor` | **Date**: 2026-08-12 | **Spec**: [spec.md](spec.md)

## Summary

Refactor the existing Next.js/React frontend across 15 approved flows and 23
design directories. `screen.png` is the visual target, `code.html` is structural
reference only, and product behavior/API contracts remain authoritative. The
implementation uses one responsive flow for each of eight responsive pairs and
keeps payment and Gate result references as states of existing routes.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19, Node.js 22+

**Primary Dependencies**: Next.js 15 App Router, React 19, npm 12, existing CSS, QRCode package, Vitest, Testing Library, Playwright

**Storage**: N/A; existing FastAPI/PostgreSQL data remains authoritative

**Testing**: Vitest, Testing Library, Playwright, ESLint, `tsc --noEmit`, Next production build

**Target Platform**: Browser at mobile, intermediate, and desktop viewport widths

**Project Type**: Web application frontend

**Performance Goals**: Preserve existing build/runtime characteristics; no new client state/cache/dependency layer

**Constraints**: Preserve routes, backend/API contracts, JWT/session behavior, authorization, inventory/payment/QR rules, dynamic data, keyboard access, and primary-content overflow safety

**Scale/Scope**: 46 reference files (23 HTML + 23 screenshots), 15 flows, 12 App Router route files, existing shared UI/event/ticket components

## Constitution Check

- Principles I–VIII: PASS — presentation-only work does not move business rules, authorization, inventory, payment, or QR decisions out of the backend.
- Principle IX: PASS — existing CSS and primitives are reused; no framework or visual library is introduced.
- Principles X–XIII: PASS — Docker, demo data, secrets, and architectural decisions remain unchanged.
- Principles XIV–XV: PASS — `DESIGN.md` and approved screenshots govern visual direction; `docs/design/` is immutable.
- Principles XVI–XVIII: PASS — behavior follows `spec.md`, this plan is technical authority, and changes require execution/review/tests.

## Actual project architecture

- Package manager: npm with `apps/web/package-lock.json` and `packageManager: npm@12.0.2`.
- Framework: Next.js 15.5 App Router with server route files under `apps/web/app/**` and client interactivity in existing components.
- Styling: `apps/web/app/globals.css` with design tokens, layout utilities, media queries, and component classes; no Tailwind, CSS Modules, Bootstrap, or React Router.
- API boundary: `apps/web/lib/api.ts` normalizes errors and base URLs; it is not a contract redesign target.
- Auth boundary: `apps/web/lib/auth.ts` stores/reads JWT session state and role guards; presentation may consume existing results but must not change authorization semantics.
- Tests: Vitest/Testing Library in `apps/web/tests/unit`, Playwright in `apps/web/tests/e2e`, plus lint/typecheck/build scripts.

## Design inventory and route/state mapping

| References | Existing route/state |
|---|---|
| `01_home` + `_desktop` | `/` |
| `02_event_detail` + `_desktop` | `/events/[eventId]` |
| `03_checkout` + `_desktop` | `/customer/checkout/[eventId]` |
| `04_payment_approved` | checkout approved state |
| `05_payment_declined` | checkout declined/recovery state |
| `06_my_tickets` + `_desktop` | `/customer/tickets` |
| `07_ticket_detail` + `_desktop` | `/customer/tickets/[ticketId]` |
| `08_shared_ticket` | `/shared/tickets/[shareToken]` |
| `09_organizer_events` + `_mobile` | `/organizer/events` |
| `10_create_event` + `_mobile` | `/organizer/events/new` |
| `11_gate_scanner` + `_desktop` | `/gate` |
| `12_valid` | Gate `VALID` state |
| `13_invalid` | Gate `INVALID` state |
| `14_already_used` | Gate `ALREADY_USED` state |
| `15_wrong_event` | Gate `WRONG_EVENT` state |

The eight pairs are Home, Event Detail, Checkout, My Tickets, Ticket Detail,
Organizer Events, Create Event, and Gate Scanner. Payment and Gate outcomes remain
state transitions in existing routes, not new routes. Reference text, images,
prices, dates, counts, identities, and credentials are illustrative; view models
and API responses remain dynamic. Conflicts are resolved in this order:
approved product requirements/specification, `DESIGN.md`, `screen.png`, then
`code.html`; any unresolved conflict returns to clarification rather than being
resolved silently in code.

## Reuse and responsive strategy

Refine existing `components/ui` primitives (`Button`, `Ticket`, `Status`,
`LedgerRow`, `Perforation`) and existing event/ticket/checkout/scanner components.
Share poster, ticket frame, ledger, field, state-message, and shell patterns only
where repeated usage is demonstrated. Keep one business component per flow and
use CSS/media queries for mobile, intermediate, and desktop composition. Tasks
sharing `globals.css`, `components/ui`, route shells, or test files are sequential;
`[P]` is reserved for independent files and completed dependencies.

## Data, state, and accessibility

Map placeholders to existing event, catalog, reservation, payment, ticket, session,
organizer, and validation view models. Preserve loading, empty, network/API,
validation, authorization, success, declined, expired, `VALID`, `INVALID`,
`ALREADY_USED`, `WRONG_EVENT`, and camera-denied/manual-fallback states. Use
semantic landmarks/headings, labels, accessible names, meaningful image
alternatives, visible focus, keyboard operation, live regions, and text/non-color
feedback. Do not alter `apps/web/lib/api.ts` or `apps/web/lib/auth.ts` in a way that
changes contracts, JWT/session behavior, role authorization, or backend decisions.

## Validation strategy

1. Baseline existing lint, typecheck, unit, build, and Customer/Organizer/Gate/Sharing E2E suites.
2. Add focused unit coverage at the concrete paths `apps/web/tests/unit/checkout-flow.test.tsx` and `apps/web/tests/unit/gate-validation.test.tsx`.
3. Validate every responsive pair at reference mobile, intermediate, and desktop widths; use a matrix for all 15 flows.
4. Run Customer purchase, Organizer create/publish, Gate/manual fallback/results, sharing, and accessibility E2E journeys.
5. Define a blocking visual mismatch as missing flow/state, broken primary interaction, wrong product behavior, unreadable content, or primary-content overflow.
6. Verify `git diff -- docs/design` is empty and run final lint/typecheck/unit/build/E2E checks.

## Project Structure

```text
apps/web/
├── app/                         # Existing App Router pages and globals.css
├── components/{ui,auth,events,checkout,tickets}/
├── lib/{api,auth}.ts            # Existing API/session boundaries
└── tests/{unit,e2e}/
```

**Structure Decision**: retain the actual Next.js App Router and existing folders;
no backend, route, persistent data model, or new interface contract is required.

## Delivery phases

1. Inventory and baseline.
2. Shared foundation.
3. Customer discovery/purchase and ticket/share flows.
4. Organizer flow.
5. Gate flow.
6. Responsive/accessibility audit, E2E, cleanup, and immutable-reference check.

## Complexity Tracking

No constitution violations or new architectural complexity are proposed.
