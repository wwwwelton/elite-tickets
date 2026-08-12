# Tasks: Catálogo Ticketmaster e evolução visual

**Input**: Design documents from `/specs/002-ticketmaster-visual-redesign/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup Ticketmaster Configuration

**Purpose**: Add backend configuration and isolate the new provider contract before changing behavior.

- [X] T001 Update backend settings for Ticketmaster in `apps/api/src/elite_tickets/shared/config.py` to accept `ticketmaster_api_key` and any provider-specific base URL or defaults needed by the plan
- [X] T002 [P] Replace legacy catalog environment examples with Ticketmaster variables in `apps/api/.env.example`, `apps/web/.env.example`, and `README.md`
- [X] T003 [P] Remove TMDb-specific naming from catalog documentation and comments in `apps/api/src/elite_tickets/catalog/` so the new provider boundary is explicit

## Phase 2: Foundational Backend Catalog Layer

**Purpose**: Create the provider abstraction and normalized catalog model that all catalog endpoints and event snapshot logic will use.

- [X] T004 [P] Create normalized catalog DTOs in `apps/api/src/elite_tickets/catalog/schemas.py` for search results, detail payloads, pagination, and error metadata
- [X] T005 [P] Create catalog mapping helpers in `apps/api/src/elite_tickets/catalog/mapping.py` to convert Ticketmaster payloads into internal DTOs
- [X] T006 [P] Create a catalog abstraction interface in `apps/api/src/elite_tickets/catalog/service.py` or `apps/api/src/elite_tickets/catalog/interfaces.py` so routes do not depend on raw Ticketmaster shapes
- [X] T007 Add Ticketmaster-specific error types and upstream state mapping in `apps/api/src/elite_tickets/catalog/errors.py`

## Phase 3: Ticketmaster HTTP Client

**Goal**: Build a backend-only client for Ticketmaster Discovery API V2 with secret-safe request handling.

**Independent Test**: Client can search and fetch detail data, handles timeout/401/429/5xx, and never exposes the API key.

- [X] T008 [P] [US1] Implement the isolated Ticketmaster HTTP client in `apps/api/src/elite_tickets/catalog/ticketmaster_client.py`
- [X] T009 [P] [US1] Add request normalization, retry, timeout, and status handling for `/events.json` and `/events/{id}.json` in `apps/api/src/elite_tickets/catalog/ticketmaster_client.py`
- [X] T010 [P] [US1] Add unit coverage for upstream request headers and retryable failures in `apps/api/tests/unit/test_ticketmaster_client.py`

## Phase 4: Catalog Service

**Goal**: Expose provider-agnostic catalog behavior over the new client.

**Independent Test**: Service can search and resolve event detail through normalized DTOs without returning raw upstream payloads.

- [X] T011 [P] [US1] Implement the provider-agnostic catalog service in `apps/api/src/elite_tickets/catalog/service.py` using the new client and mapping helpers
- [X] T012 [P] [US1] Add service-level tests for search pagination, keyword filtering, countryCode defaulting, city filtering, and missing optional fields in `apps/api/tests/unit/test_catalog_service.py`
- [X] T013 [US1] Add service-level tests for empty results, 401, 429, timeout, and 5xx state mapping in `apps/api/tests/unit/test_catalog_service.py`

## Phase 5: Catalog Endpoints

**Goal**: Replace the current catalog route with EliteTickets-owned search and detail endpoints.

**Independent Test**: `/api/v1/catalog/events` and `/api/v1/catalog/events/{external_id}` return normalized contracts and appropriate error states.

- [X] T014 [P] [US1] Implement catalog search and detail routes in `apps/api/src/elite_tickets/catalog/router.py`
- [X] T015 [P] [US1] Add router wiring in `apps/api/src/elite_tickets/main.py` if any route prefixes or dependency providers need updates
- [X] T016 [P] [US1] Add integration tests for catalog search and detail contracts in `apps/api/tests/integration/test_catalog.py`
- [X] T017 [US1] Add integration tests for catalog error states and secret-safe responses in `apps/api/tests/integration/test_catalog.py`

## Phase 6: Event Snapshot Persistence

**Goal**: Persist the external origin snapshot when an organizer creates an event and keep the event functional offline later.

**Independent Test**: Creating an event stores the normalized snapshot and later rendering does not require a fresh provider call.

- [X] T018 [P] [US2] Extend `apps/api/src/elite_tickets/events/models.py` with the external snapshot fields and any relationship adjustments required by the plan
- [X] T019 [P] [US2] Update `apps/api/alembic/versions/0002_commerce.py` or create a new migration under `apps/api/alembic/versions/` for the snapshot columns/table changes
- [X] T020 [P] [US2] Update `apps/api/src/elite_tickets/events/organizer_service.py` so event creation persists the normalized Ticketmaster snapshot
- [X] T021 [US2] Add integration tests for snapshot creation, immutability, and preserved rendering in `apps/api/tests/integration/test_organizer_events.py`

## Phase 7: Backend Regression Tests

**Goal**: Cover the new provider behavior and ensure existing business rules keep working.

**Independent Test**: Backend test suite covers mapping, upstream failures, snapshot creation, and missing optional fields while existing flows remain green.

- [X] T022 [P] [US3] Add mapping and optional-field coverage in `apps/api/tests/integration/test_catalog.py`
- [X] T023 [P] [US5] Add snapshot persistence and outage resilience coverage in `apps/api/tests/integration/test_organizer_events.py`
- [X] T024 [P] [US5] Add a regression test for event rendering during catalog outage in `apps/api/tests/integration/test_public_events.py`
- [X] T025 [US5] Add a regression test to ensure Ticketmaster credentials never appear in backend errors or logs in `apps/api/tests/integration/test_catalog.py`

## Phase 8: Design Inventory

**Goal**: Inventory the current frontend and extract the design structure from approved HTML references before refactoring pages.

**Independent Test**: The inventory identifies current routes, shared components, and the approved visual patterns that will be reused.

- [X] T026 [P] [US4] Document the current frontend route and component inventory in `apps/web/README.md` or `specs/002-ticketmaster-visual-redesign/frontend-inventory.md`
- [X] T027 [P] [US4] Extract visual findings from `docs/design/stitch-prompts.md` and `docs/design/*.html` into `specs/002-ticketmaster-visual-redesign/frontend-inventory.md`

## Phase 9: Design Tokens

**Goal**: Align the frontend foundation to DESIGN.md before migrating pages.

**Independent Test**: Global styles compile, the typography/color tokens match the approved design system, and no new visual language is introduced.

- [X] T028 [P] [US4] Refine global CSS tokens and typography in `apps/web/app/globals.css` to match DESIGN.md exactly
- [X] T029 [P] [US4] Update root metadata and layout shell in `apps/web/app/layout.tsx` for the editorial ticket presentation baseline
- [X] T030 [US4] Add style regression tests or snapshots for the shared design tokens in `apps/web/tests/unit/`

## Phase 10: Shared Components

**Goal**: Build reusable primitives before page migrations.

**Independent Test**: Shared components render the approved ticket, perforation, status, and ledger patterns across roles.

- [X] T031 [P] [US4] Refactor shared ticket primitives in `apps/web/components/ui/ticket.tsx`, `apps/web/components/ui/perforation.tsx`, `apps/web/components/ui/status.tsx`, and `apps/web/components/ui/ledger.tsx`
- [X] T032 [P] [US4] Update event media and card composition components in `apps/web/components/events/poster.tsx`, `apps/web/components/events/event-card.tsx`, and `apps/web/components/events/event-list.tsx`
- [X] T033 [US4] Add unit tests for shared UI primitives in `apps/web/tests/unit/ticket-accessibility.test.tsx` and related component tests

## Phase 11: Customer Pages

**Goal**: Rebuild customer-facing catalog browsing and event detail views on top of the shared design system.

**Independent Test**: Home and event detail pages remain mobile-first and functional with the new visual language.

- [X] T034 [P] [US4] Rebuild the public home page in `apps/web/app/(public)/page.tsx` to use the new shared components and catalog data contract
- [X] T035 [P] [US4] Rebuild the public event detail page in `apps/web/app/(public)/events/[eventId]/page.tsx` with the approved layout patterns
- [X] T036 [US4] Add or update frontend tests for public catalog and detail rendering in `apps/web/tests/unit/` or `apps/web/tests/e2e/`

## Phase 12: Checkout

**Goal**: Preserve the checkout journey while aligning the layout to the new design system.

**Independent Test**: Checkout still resolves quantity, reservation, and payment states without visual regressions.

- [X] T037 [P] [US4] Rebuild the checkout page shell in `apps/web/app/customer/checkout/[eventId]/page.tsx`
- [X] T038 [P] [US4] Update the checkout flow component composition in `apps/web/components/checkout/checkout-flow.tsx` and `apps/web/components/checkout/countdown.tsx`
- [X] T039 [US4] Add checkout regression tests in `apps/web/tests/e2e/customer-purchase.spec.ts`

## Phase 13: Tickets

**Goal**: Preserve My Tickets, Ticket Detail, Shared Ticket, QR, and share actions with the revised visual system.

**Independent Test**: Ticket views render, share, and validate as before.

- [X] T040 [P] [US4] Rebuild the customer tickets index page in `apps/web/app/customer/tickets/page.tsx`
- [X] T041 [P] [US4] Rebuild the ticket detail page in `apps/web/app/customer/tickets/[ticketId]/page.tsx`
- [X] T042 [P] [US4] Rebuild the shared ticket page in `apps/web/app/shared/tickets/[shareToken]/page.tsx`
- [X] T043 [US4] Update ticket and share components in `apps/web/components/tickets/ticket.tsx`, `apps/web/components/tickets/my-tickets.tsx`, and `apps/web/components/tickets/share-action.tsx`
- [X] T044 [US4] Add ticket accessibility and sharing regression tests in `apps/web/tests/unit/` and `apps/web/tests/e2e/ticket-sharing.spec.ts`

## Phase 14: Organizer

**Goal**: Preserve organizer flows and inventory visibility under the new design.

**Independent Test**: Organizer authentication, catalog access, event list, and inventory counts still work.

- [X] T045 [P] [US4] Rebuild the organizer events page in `apps/web/app/organizer/events/page.tsx`
- [X] T046 [P] [US4] Update organizer ledger and event list components in `apps/web/components/events/organizer-ledger.tsx`, `apps/web/components/events/event-list.tsx`, and related files
- [X] T047 [US4] Add organizer regression tests in `apps/web/tests/e2e/organizer-events.spec.ts`

## Phase 15: Ticketmaster Selector

**Goal**: Implement the organizer catalog search, selection, and create-event flow against the new backend contracts.

**Independent Test**: Organizer can search Ticketmaster, select a result, and create an EliteTickets event with a persisted snapshot.

- [X] T048 [P] [US1] Rebuild the create-event page in `apps/web/app/organizer/events/new/page.tsx`
- [X] T049 [P] [US1] Update the event creation form in `apps/web/components/events/event-form.tsx` to consume `/api/v1/catalog/events` and `/api/v1/catalog/events/{external_id}`
- [X] T050 [P] [US3] Add explicit loading, empty, auth/config, rate-limit, and error states for the catalog selector in `apps/web/components/events/event-form.tsx`
- [X] T051 [US1] Add frontend tests for organizer catalog search and selection in `apps/web/tests/unit/` or `apps/web/tests/e2e/organizer-events.spec.ts`

## Phase 16: Gate

**Goal**: Preserve the gate workflow and visual speed/legibility.

**Independent Test**: Gate selection, QR scan, manual entry, and validation states remain intact.

- [X] T052 [P] [US4] Rebuild the gate page in `apps/web/app/gate/page.tsx`
- [X] T053 [P] [US4] Update scanner and validation result components in `apps/web/components/tickets/scanner.tsx` and `apps/web/components/tickets/validation-result.tsx`
- [X] T054 [US4] Add gate regression tests in `apps/web/tests/e2e/gate-validation.spec.ts`

## Phase 17: Responsive and Accessibility Pass

**Goal**: Verify mobile-first customer behavior, organizer desktop ergonomics, and gate legibility across breakpoints.

**Independent Test**: Layouts adapt cleanly at mobile and desktop widths and maintain accessibility expectations.

- [X] T055 [P] [US4] Audit and fix responsive layout issues in `apps/web/app/**` and `apps/web/components/**` discovered during page migration
- [ ] T056 [P] [US4] Improve accessibility labels, focus states, and status semantics in `apps/web/components/ui/` and `apps/web/components/tickets/`
- [ ] T057 [US4] Update or add accessibility coverage in `apps/web/tests/e2e/accessibility.spec.ts`

## Phase 18: Remove Frontend Legacy Visual Code

**Goal**: Delete obsolete visual code only after replacements are in place and tested.

**Independent Test**: No dead visual components or unused CSS remain for the migrated paths.

- [ ] T058 [P] [US4] Remove obsolete legacy event and ticket styling from `apps/web/app/globals.css` and any replaced component files
- [ ] T059 [P] [US4] Remove unused frontend components or helpers superseded by the new shared primitives in `apps/web/components/`
- [ ] T060 [US4] Run a final frontend lint and build pass to confirm the removed legacy code did not break imports in `apps/web/package.json` scripts

## Phase 19: E2E

**Goal**: Re-run and stabilize the end-to-end journeys after the redesign and catalog switch.

**Independent Test**: Customer, organizer, and gate E2E flows still pass end to end on the new implementation.

- [ ] T061 [P] [US5] Update customer purchase E2E expectations in `apps/web/tests/e2e/customer-purchase.spec.ts`
- [ ] T062 [P] [US5] Update organizer E2E expectations in `apps/web/tests/e2e/organizer-events.spec.ts`
- [ ] T063 [P] [US5] Update gate E2E expectations in `apps/web/tests/e2e/gate-validation.spec.ts`
- [ ] T064 [P] [US5] Update ticket sharing E2E expectations in `apps/web/tests/e2e/ticket-sharing.spec.ts`

## Phase 20: README

**Goal**: Document the new catalog flow, local setup, and validation steps.

**Independent Test**: A new contributor can run the feature locally and validate the main journeys using the documented steps.

- [ ] T065 [P] [US5] Update the repository README and feature notes in `README.md` and `specs/002-ticketmaster-visual-redesign/quickstart.md`
- [ ] T066 [P] [US5] Add a short implementation summary and validation checklist to `specs/002-ticketmaster-visual-redesign/README.md`

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: Starts immediately.
- **Phase 2**: Depends on Phase 1 and blocks all later work.
- **Phases 3-7**: Backend catalog and snapshot work; complete before frontend migration starts.
- **Phases 8-18**: Frontend redesign and regression passes; can start after the backend contract is stable.
- **Phase 19**: Final E2E stabilization after feature work is in place.
- **Phase 20**: Documentation polish after validation.

### Story Dependencies

- **US1** depends on Phases 1-7.
- **US2** depends on Phases 1-7 and uses the same snapshot contract as US1.
- **US3** depends on Phases 1-5 and the backend error contract from Phase 4/5.
- **US4** depends on Phases 8-18.
- **US5** depends on Phases 2-7 plus the frontend regression coverage in Phases 11-19.

## Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T004 through T007 can run in parallel because they touch separate backend files.
- T008 through T010 can run in parallel once the DTO layer exists.
- T011 through T013 can overlap with the client tests once mapping helpers are ready.
- T014 through T017 can proceed in parallel after the service exists.
- T018 and T019 can run in parallel with T020 once the snapshot shape is agreed.
- T026 and T027 can run in parallel.
- T028 through T030 can overlap with the shared design inventory.
- T031 through T033 can be split across UI primitives and tests.
- T034 and T035 can run in parallel after shared components stabilize.
- T037 and T038 can run in parallel for checkout.
- T040 through T043 can be split across pages and shared ticket components.
- T045 and T046 can run in parallel for organizer work.
- T048 through T051 can overlap for the Ticketmaster selector.
- T052 and T053 can run in parallel for gate work.
- T055 and T056 can run in parallel during the accessibility pass.
- T058 and T059 can run in parallel during legacy cleanup.
- T061 through T064 can run in parallel once the UI is stable.

## Implementation Strategy

### MVP First

1. Finish Phases 1-7.
2. Validate the organizer can search Ticketmaster, select an item, create an event, and keep the event usable offline.
3. Stop and verify backend regression tests before starting the visual migration.

### Incremental Delivery

1. Ship the backend catalog replacement first.
2. Move the frontend foundation and shared primitives next.
3. Rebuild customer, checkout, tickets, organizer, selector, and gate flows one by one.
4. Finish with accessibility, cleanup, E2E stabilization, and documentation.

## Phase 21: Convergence

- [ ] T067 CRITICAL replace the numeric `tmdb_id` event-creation contract with the Ticketmaster `external_id` string across organizer routes, services, frontend payloads, and automated tests per FR-004 and US1/AC3 (contradicts)
- [ ] T068 Render absolute Ticketmaster snapshot image URLs without the legacy TMDb prefix and configure the frontend image allowlist with regression coverage per FR-008 and SC-003 (contradicts)
- [ ] T069 Replace active TMDb runtime and deployment configuration, remove the obsolete catalog adapter and compatibility aliases, and adapt demo data without requiring real provider credentials per FR-001, FR-013, and plan: catalog integration (partial)
- [ ] T070 Return the explicit HTTP 429 catalog rate-limit contract and update backend contract tests per FR-011 and `contracts/catalog-errors.md` (contradicts)
- [ ] T071 Normalize incomplete or malformed Ticketmaster payloads into secret-safe provider errors and add coverage per FR-010 and Edge Cases (partial)
- [ ] T072 Resolve the normalized catalog detail endpoint when the organizer selects a result and preserve the valid selection/retry behavior per plan: API contract and T049 (partial)
- [ ] T073 Rebuild the login page and form with reusable editorial ticket components while preserving role redirects and authentication errors per FR-020 and FR-021 (missing)
- [ ] T074 Recompose approved, declined, and expired checkout states with the approved transactional hierarchy and regression coverage per FR-018 and FR-021 (partial)
- [ ] T075 Present distinct catalog authentication/configuration, rate-limit, unavailable, loading, and empty states with actionable guidance and component tests per FR-011, FR-012, and SC-004 (partial)
- [ ] T076 Persist complete immutable Ticketmaster provenance, including non-null external identification and optional canonical URL, with migration and snapshot tests per FR-008, FR-009, and `data-model.md` (partial)
