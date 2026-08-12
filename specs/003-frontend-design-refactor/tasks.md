# Tasks: Frontend Design Refactor

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Scope**: Frontend-only refactor. No backend, API contract, route, domain-model, or `docs/design/` changes are permitted.

## Phase 1: Baseline and mapping

- [X] T001 Create a route/component/design inventory covering all 23 `docs/design/*/code.html` and `screen.png` references, their 15 flows, and eight responsive pairs in `specs/003-frontend-design-refactor/research.md` (FR-001, FR-002)
- [X] T002 Record screenshot-versus-product-requirement discrepancies and placeholder-data rules in `specs/003-frontend-design-refactor/research.md` after T001, without editing `docs/design/` (FR-002, FR-003, FR-013)
- [X] T003 Run the existing backend contract/regression suite from `apps/api` plus frontend lint, typecheck, unit tests, production build, and Customer/Organizer/Gate/Sharing Playwright suites from `apps/web/package.json`; record the baseline in `specs/003-frontend-design-refactor/quickstart.md` (FR-004, FR-014, SC-005)

## Phase 2: Shared UI foundation

- [X] T004 Refine design tokens, typography, spacing, grid, responsive breakpoints, focus styling, and overflow-safe primitives in `apps/web/app/globals.css` using `DESIGN.md` and screenshots (FR-001, FR-009, FR-010, FR-011)
- [X] T005 [P] After T004, refine reusable `Button`, `Ticket`, `Status`, `LedgerRow`, and `Perforation` primitives in `apps/web/components/ui/{button,ticket,status,ledger,perforation}.tsx` and `apps/web/components/ui/index.ts` (FR-009, FR-010, FR-016)
- [X] T006 Create/refine shared poster, page-shell, field, loading, empty, error, and result-state patterns in `apps/web/components/events/poster.tsx`, `apps/web/components/ui/`, and `apps/web/app/globals.css` after T004–T005 (FR-008, FR-009, FR-010, FR-016)
- [X] T007 Add unit coverage for shared primitives, state semantics, focus-visible behavior, and missing-image fallback in `apps/web/tests/unit/ui-primitives.test.tsx`, `apps/web/tests/unit/design-tokens.test.tsx`, and `apps/web/tests/unit/image-config.test.ts` (FR-008, FR-010, SC-007)

## Phase 3: User Story 1 — Discover and purchase an event (Priority: P1) 🎯 MVP

**Independent Test**: Seeded Customer uses `/`, `/events/[eventId]`, and `/customer/checkout/[eventId]` at mobile, intermediate, and desktop widths; approved payment issues a ticket and declined payment recovers without issuance.

- [X] T008 [P] [US1] Recompose Customer home and event-card/list hierarchy for `01_home` + `01_home_desktop` in `apps/web/app/(public)/page.tsx` and `apps/web/components/events/{event-card,event-list}.tsx`, preserving live loading, empty, and error data (FR-001, FR-003, FR-005, FR-008)
- [X] T009 [P] [US1] Recompose Event Detail for `02_event_detail` + `02_event_detail_desktop` in `apps/web/app/(public)/events/[eventId]/page.tsx` and `apps/web/components/events/quantity-control.tsx`, preserving availability and quantity validation (FR-001, FR-003, FR-005)
- [X] T010 [US1] Recompose Checkout for `03_checkout` + `03_checkout_desktop` in `apps/web/app/customer/checkout/[eventId]/page.tsx` and `apps/web/components/checkout/{checkout-flow,countdown}.tsx`, preserving reservation expiry, payment idempotency, and API errors (FR-001, FR-004, FR-005, FR-008)
- [X] T011 [US1] Recompose approved and declined payment states in `apps/web/components/checkout/checkout-flow.tsx` with recovery/expiry messaging and no false issuance (FR-005, FR-008, SC-003)
- [X] T012 [US1] Add unit assertions for Customer data binding, quantity/checkout states, approved/declined/expired semantics, and recovery messaging in `apps/web/tests/unit/public-pages.test.tsx`, `apps/web/tests/unit/countdown.test.tsx`, and `apps/web/tests/unit/checkout-flow.test.tsx` (FR-003, FR-005, FR-008, SC-003, SC-007)
- [X] T013 [US1] Update Customer purchase E2E expectations for responsive home/detail/checkout and approved/declined outcomes in `apps/web/tests/e2e/customer-purchase.spec.ts` (FR-014, SC-003, SC-005)

## Phase 4: User Story 2 — Manage, view, and share tickets (Priority: P1)

**Independent Test**: An issued ticket remains discoverable, its secure QR remains available, and its share link remains read-only according to existing API behavior at mobile and desktop widths.

- [X] T014 [P] [US2] Recompose My Tickets for `06_my_tickets` + `06_my_tickets_desktop` in `apps/web/app/customer/tickets/page.tsx` and `apps/web/components/tickets/my-tickets.tsx` with dynamic loading, empty, error, and ticket data (FR-001, FR-003, FR-005, FR-008)
- [X] T015 [P] [US2] Recompose Ticket Detail/QR for `07_ticket_detail` + `07_ticket_detail_desktop` in `apps/web/app/customer/tickets/[ticketId]/page.tsx` and `apps/web/components/tickets/ticket.tsx`, preserving secure QR and status semantics (FR-001, FR-005, FR-010, FR-012)
- [X] T016 [P] [US2] Recompose public Shared Ticket for `08_shared_ticket` in `apps/web/app/shared/tickets/[shareToken]/page.tsx` and `apps/web/components/tickets/share-action.tsx`, preserving read-only controls, no-store behavior, and expiry/used states (FR-003, FR-005, FR-008, FR-012)
- [X] T017 [US2] Add/update ticket, QR, sharing, and public read-only unit coverage in `apps/web/tests/unit/ticket-accessibility.test.tsx` and `apps/web/tests/unit/ticket-sharing.test.tsx` (FR-010, FR-012, SC-007)
- [X] T018 [US2] Update ticket-sharing and accessibility E2E expectations in `apps/web/tests/e2e/ticket-sharing.spec.ts` and `apps/web/tests/e2e/accessibility.spec.ts` (FR-014, SC-005, SC-006, SC-007)

## Phase 5: User Story 3 — Create and manage organizer events (Priority: P2)

**Independent Test**: An authorized Organizer uses `/organizer/events` and `/organizer/events/new` to select catalog content, create a draft, and publish it; wrong roles remain blocked.

- [X] T019 [US3] Recompose Organizer Events for `09_organizer_events` + `09_organizer_events_mobile` in `apps/web/app/organizer/events/page.tsx` and `apps/web/components/events/organizer-ledger.tsx`, preserving status, availability, loading, empty, and errors (FR-001, FR-006, FR-008)
- [X] T020 [US3] Recompose Create Event for `10_create_event` + `10_create_event_mobile` in `apps/web/app/organizer/events/new/page.tsx` and `apps/web/components/events/event-form.tsx`, preserving catalog selection, validation, draft creation, and publish behavior (FR-001, FR-003, FR-006)
- [X] T021 [US3] Preserve existing authentication/role-guard and normalized catalog error presentation by changing only presentation branches in `apps/web/components/events/event-form.tsx`; do not modify `apps/web/lib/api.ts` or `apps/web/lib/auth.ts`, contracts, JWT/session behavior, or authorization decisions (FR-004, FR-006, FR-008, FR-015)
- [X] T022 [US3] Update organizer and accessibility E2E coverage in `apps/web/tests/e2e/organizer-events.spec.ts` and `apps/web/tests/e2e/accessibility.spec.ts` for responsive catalog selection, draft/publish, loading/empty/error, and wrong-role behavior (FR-014, SC-004, SC-005, SC-006, SC-007)

## Phase 6: User Story 4 — Validate entry at the gate (Priority: P2)

**Independent Test**: An authorized Gate user selects an event, uses manual or camera input, and receives distinct VALID, INVALID, ALREADY_USED, or WRONG_EVENT results; camera failure leaves manual validation usable.

- [X] T023 [US4] Recompose Gate Scanner for `11_gate_scanner` + `11_gate_scanner_desktop` in `apps/web/app/gate/page.tsx` and `apps/web/components/tickets/scanner.tsx`, preserving event selection, camera permissions, manual fallback, loading, empty, and API errors (FR-001, FR-007, FR-008, FR-010)
- [X] T024 [P] [US4] Recompose VALID, INVALID, ALREADY_USED, and WRONG_EVENT states in `apps/web/components/tickets/validation-result.tsx` for references `12_valid`, `13_invalid`, `14_already_used`, and `15_wrong_event`, without color-only meaning (FR-007, FR-010)
- [X] T025 [US4] Add/update Gate result and camera-fallback unit coverage in `apps/web/tests/unit/ticket-accessibility.test.tsx` and `apps/web/tests/unit/gate-validation.test.tsx` (FR-007, FR-008, FR-010, FR-017, SC-007)
- [X] T026 [US4] Update Gate E2E expectations for scanner/manual fallback, keyboard operation, and all four result states in `apps/web/tests/e2e/gate-validation.spec.ts` and `apps/web/tests/e2e/accessibility.spec.ts` (FR-014, SC-004, SC-006, SC-007)

## Phase 7: Cross-cutting validation and polish

- [X] T027 [P] Run a viewport matrix for the eight responsive pairs (`01_home`, `02_event_detail`, `03_checkout`, `06_my_tickets`, `07_ticket_detail`, `09_organizer_events`, `10_create_event`, `11_gate_scanner`) at reference mobile, intermediate, and desktop widths; document intentional discrepancies and the nominal state matrix (loading, empty, API/network error, validation error, authorization, success, approved, declined, expired, VALID, INVALID, ALREADY_USED, WRONG_EVENT, camera failure/manual fallback) in `specs/003-frontend-design-refactor/quickstart.md` (FR-001, FR-008, FR-011, FR-014, SC-001, SC-002, SC-007)
- [X] T028 [P] Audit keyboard order, visible focus, semantic landmarks, labels, live regions, image alternatives, and non-color state feedback across `apps/web/app/**` and `apps/web/components/**`; add assertions in `apps/web/tests/e2e/accessibility.spec.ts` (FR-010, FR-014, SC-006, SC-007)
- [ ] T029 Remove only obsolete CSS/component code proven unused after migration from `apps/web/app/globals.css` and `apps/web/components/**`, preserving shared primitives and dynamic behavior (FR-009, scope constraint)
- [X] T030 Run final `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and all Customer/Organizer/Gate/Sharing Playwright suites from `apps/web/`; record results in `specs/003-frontend-design-refactor/quickstart.md` (SC-005, SC-007)
- [X] T031 [P] Verify `git diff -- docs/design` is empty and all 23 design directories remain present and mapped in `specs/003-frontend-design-refactor/research.md` (FR-013, SC-001)

## Dependencies and execution order

- Phase 1 precedes all implementation; T003 establishes the baseline.
- Phase 2 depends on Phase 1 and blocks all story work.
- US1 and US2 can proceed in parallel after Phase 2; tasks touching shared primitives wait for T005–T007.
- US3 and US4 can proceed in parallel after Phase 2; each remains sequential internally.
- Phase 7 depends on all story migrations and focused tests.

### Safe parallel opportunities

- T005 may run independently after T004; T008 and T009; T014–T016; T027, T028, and T031 after migrations. T001/T002 and T004/T005/T006 are sequential because they share artifacts.

## Implementation strategy

1. Establish inventory and baseline.
2. Ship shared foundation.
3. MVP: complete US1 customer discovery and purchase.
4. Complete ticket/share, organizer, and gate flows incrementally.
5. Finish accessibility, responsive validation, cleanup, E2E, and immutable-reference verification.

Every task is commit-sized, names a bounded file area, and maps to FR/SC or an explicit plan/scope constraint.
