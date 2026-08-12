# Tasks: Frontend Navigation/Auth Redesign

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Scope**: Frontend-only navigation and authentication UX refactor. No backend, API contract, route, domain-model, or `docs/design/` changes are permitted.

## Phase 1: Baseline / current-state audit

**Goal**: Document the actual route, auth, and navigation state before changing behavior.

**Independent Test**: The audit artifacts should identify all 15 design page groups, all existing protected routes, and the current missing navigation entry points.

- [ ] T001 [P] Document the current route map, shared components, and design-reference coverage for all 15 approved page groups in `specs/003-frontend-design-refactor/research.md` (FR-001, FR-002, SC-001)
- [ ] T002 [P] Record the current auth/session/role model, route-guard behavior, and role-home redirects in `apps/web/lib/auth.ts` and summarize the verified behavior in `specs/003-frontend-design-refactor/research.md` (FR-004, FR-007, FR-018)
- [ ] T003 [P] Capture verified navigation gaps for signed-out Login visibility, My Tickets entry, Organizer entry, Create Event entry, Gate entry, and Logout in `specs/003-frontend-design-refactor/research.md` (FR-005, FR-008, FR-009, FR-010)
- [ ] T004 [P] Record approved design/product mismatches, static-data constraints, and `docs/design/` immutability notes in `specs/003-frontend-design-refactor/research.md` (FR-002, FR-003, FR-016)
- [ ] T005 Create a baseline validation log covering current lint, typecheck, unit, and Playwright results in `specs/003-frontend-design-refactor/quickstart.md` (SC-005, SC-007)

## Phase 2: Shared application shell / role navigation foundation

**Goal**: Establish a single role-aware shell and shared navigation behavior that every story can reuse.

**Independent Test**: Signed-out visitors, Customers, Organizers, and Gate staff each see the correct navigation, login/logout affordances, and access-denied behavior without altering backend authorization.

- [ ] T006 [P] Define the shared navigation model, role-specific top-level actions, and responsive menu behavior in `apps/web/app/layout.tsx` and `apps/web/app/globals.css` (FR-005, FR-012, FR-013, SC-006)
- [X] T007 [P] Implement a reusable shell/navigation component for signed-out, Customer, Organizer, and Gate states in `apps/web/components/ui/` or `apps/web/components/auth/` (FR-005, FR-008, FR-009, FR-010, FR-012)
- [X] T008 [P] Update `apps/web/lib/auth.ts` to expose the role-home and route-guard behavior needed by the shared shell without changing session semantics or authorization authority (FR-004, FR-007, FR-018)
- [X] T009 [P] Add explicit Login/Entrar and Logout/Sair entry points that remain visible in the public shell and authenticated shell in `apps/web/app/layout.tsx`, `apps/web/app/login/page.tsx`, and related shell components (FR-005, FR-007, FR-012)
- [X] T010 [P] Add explicit access-denied and auth-required presentation states that align with existing guard outcomes in `apps/web/components/ui/state-message.tsx` and route-level wrappers under `apps/web/app/**` (FR-004, FR-011, FR-018)
- [X] T011 Add unit coverage for shared navigation visibility, logout transitions, and role-based route-guard messaging in `apps/web/tests/unit/auth.test.ts` and `apps/web/tests/unit/login-form.test.tsx` (FR-005, FR-007, FR-010, SC-007)

## Phase 3: User Story 1 - Discover and purchase an event (Priority: P1) 🎯 MVP

**Goal**: Make customer browsing, search, checkout entry, and payment-result continuity easy to find from the shared shell.

**Independent Test**: A signed-out visitor or Customer can discover events, search, open event detail, enter checkout, and reach approved/declined result states with the new shell in place.

- [X] T012 [P] [US1] Add customer-facing Home/Search navigation entry points and signed-out Login visibility in `apps/web/app/(public)/page.tsx`, `apps/web/components/events/event-list.tsx`, and `apps/web/components/events/event-card.tsx` (FR-005, FR-006, FR-013, FR-014)
- [X] T013 [P] [US1] Add customer navigation continuity for event detail and checkout entry in `apps/web/app/(public)/events/[eventId]/page.tsx` and `apps/web/app/customer/checkout/[eventId]/page.tsx` (FR-006, FR-007, FR-014)
- [X] T014 [US1] Ensure approved and declined payment result states remain reachable from checkout flow state handling in `apps/web/components/checkout/checkout-flow.tsx` and `apps/web/components/checkout/countdown.tsx` (FR-011, FR-014)
- [X] T015 [P] [US1] Update customer My Tickets entry and customer-session navigation in `apps/web/app/customer/tickets/page.tsx` and `apps/web/components/tickets/my-tickets.tsx` (FR-006, FR-007, FR-012)
- [X] T016 [US1] Add customer journey assertions for signed-out Login visibility, Home/Search navigation, checkout continuity, and payment-result navigation in `apps/web/tests/e2e/customer-purchase.spec.ts` and `apps/web/tests/unit/public-pages.test.tsx` (SC-003, SC-005, SC-006)

## Phase 4: User Story 2 - Manage, view, and share tickets (Priority: P1)

**Goal**: Keep My Tickets, Ticket Detail, QR display, and Shared Ticket available through the authenticated customer experience.

**Independent Test**: A Customer can move from My Tickets to ticket detail, see the QR/share affordances, and open a read-only shared ticket without exposing private actions.

- [X] T017 [P] [US2] Add customer ticket-detail navigation, QR, and share affordances in `apps/web/app/customer/tickets/[ticketId]/page.tsx` and `apps/web/components/tickets/ticket.tsx` (FR-006, FR-015, FR-012)
- [X] T018 [P] [US2] Preserve read-only shared-ticket navigation and sharing boundaries in `apps/web/app/shared/tickets/[shareToken]/page.tsx` and `apps/web/components/tickets/share-action.tsx` (FR-015, FR-018)
- [X] T019 [US2] Add unit coverage for My Tickets, ticket detail, QR/share state, and shared-ticket read-only behavior in `apps/web/tests/unit/ticket-accessibility.test.tsx` and `apps/web/tests/unit/ticket-sharing.test.tsx` (SC-007, FR-015)
- [X] T020 [US2] Update ticket-sharing and accessibility E2E coverage in `apps/web/tests/e2e/ticket-sharing.spec.ts` and `apps/web/tests/e2e/accessibility.spec.ts` (SC-005, SC-006, SC-007)

## Phase 5: User Story 3 - Create and manage organizer events (Priority: P2)

**Goal**: Make Organizer entry, Organizer Events, Create Event, and return/public navigation visible without exposing customer-only actions.

**Independent Test**: An Organizer can enter the organizer area, reach events and create-event navigation, use the existing catalog-backed workflow, and return to the public experience appropriately.

- [X] T021 [P] [US3] Add organizer entry and organizer-session navigation in `apps/web/app/organizer/events/page.tsx` and `apps/web/components/events/organizer-ledger.tsx` (FR-008, FR-010, FR-012)
- [X] T022 [P] [US3] Add Create Event navigation and catalog workflow continuity in `apps/web/app/organizer/events/new/page.tsx` and `apps/web/components/events/event-form.tsx` (FR-008, FR-018)
- [ ] T023 [US3] Preserve organizer inventory/sales visibility and public-experience return navigation in `apps/web/components/events/organizer-ledger.tsx`, `apps/web/app/layout.tsx`, and any organizer shell helpers (FR-008, FR-009, FR-012)
- [ ] T024 [US3] Add organizer navigation and role-guard assertions in `apps/web/tests/e2e/organizer-events.spec.ts` and `apps/web/tests/unit/auth.test.ts` (SC-004, SC-005, SC-006, FR-018)

## Phase 6: User Story 4 - Validate entry at the gate (Priority: P2)

**Goal**: Make Gate/Portaria entry, event selection, scanner/manual fallback, and validation outcomes fast and explicit.

**Independent Test**: A Gate user lands directly on event selection, can validate via camera or manual code, and sees VALID, INVALID, ALREADY USED, or WRONG EVENT with a clear next action.

- [ ] T025 [P] [US4] Add Gate/Portaria entry and direct event-selection landing behavior in `apps/web/app/gate/page.tsx` and `apps/web/components/tickets/scanner.tsx` (FR-009, FR-010, FR-012)
- [ ] T026 [P] [US4] Preserve scanner/manual fallback and next-validation action semantics in `apps/web/components/tickets/scanner.tsx` and `apps/web/components/tickets/validation-result.tsx` (FR-011, FR-013, FR-015)
- [ ] T027 [P] [US4] Ensure the four gate validation states remain unmistakable and non-color-dependent in `apps/web/components/tickets/validation-result.tsx` (FR-011, FR-013, FR-015)
- [ ] T028 [US4] Add gate navigation, camera-fallback, and all four outcome assertions in `apps/web/tests/e2e/gate-validation.spec.ts` and `apps/web/tests/unit/gate-validation.test.tsx` (SC-004, SC-006, SC-007)

## Phase 7: Accessibility / state completeness / regression

**Goal**: Close the refactor with accessible, reviewable, and fully regression-covered navigation behavior.

**Independent Test**: The full shell works with keyboard-only input, keeps focus/focus order usable in mobile menus, preserves loading/empty/error/access-denied states, and leaves `docs/design/` unchanged.

- [ ] T029 [P] Audit and refine loading, empty, API/network error, auth-required, and access-denied messaging in `apps/web/components/ui/state-message.tsx`, `apps/web/components/events/event-list.tsx`, `apps/web/components/tickets/my-tickets.tsx`, and route wrappers under `apps/web/app/**` (FR-011, FR-013, FR-018)
- [ ] T030 [P] Audit semantic navigation, keyboard order, visible focus, and mobile-menu open/close behavior in `apps/web/app/layout.tsx`, `apps/web/app/globals.css`, and shared shell components (FR-012, FR-013, SC-006)
- [ ] T031 [P] Update responsive navigation assertions for intermediate widths and all eight responsive pairs in `apps/web/tests/e2e/accessibility.spec.ts` and `apps/web/tests/e2e/customer-purchase.spec.ts` (FR-014, SC-001, SC-002, SC-006)
- [ ] T032 Run final `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and the Customer/Organizer/Gate/Sharing Playwright suites from `apps/web/`, then record the results in `specs/003-frontend-design-refactor/quickstart.md` (SC-005, SC-007)
- [ ] T033 Verify `git diff -- docs/design` remains empty and that all 15 design page groups are still mapped in `specs/003-frontend-design-refactor/research.md` (FR-016, SC-001)

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies - baseline audit can start immediately.
- **Phase 2**: Depends on Phase 1 completion - blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 - foundation for customer journeys.
- **Phase 4 (US2)**: Depends on Phase 2 - can follow or run alongside US1 after shared shell work.
- **Phase 5 (US3)**: Depends on Phase 2 - organizer navigation builds on the shared shell.
- **Phase 6 (US4)**: Depends on Phase 2 - gate navigation builds on the shared shell.
- **Phase 7**: Depends on all targeted user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Independent after shared shell work.
- **US2 (P1)**: Independent after shared shell work; may reuse customer shell work from US1.
- **US3 (P2)**: Independent after shared shell work.
- **US4 (P2)**: Independent after shared shell work.

### Within Each User Story

- Shared-shell dependencies must land before story-specific navigation work.
- Story-specific unit/E2E assertions should be updated in the same phase as the related UI changes.
- No task should modify `docs/design/`.

### Parallel Opportunities

- T001–T004 can run in parallel because they only update research notes.
- T006–T010 can run in parallel once T005 is complete if they touch distinct files or non-overlapping helpers.
- T012–T015 can run in parallel after the shared shell is ready.
- T017–T018 can run in parallel after customer ticket navigation is in place.
- T021–T022 can run in parallel after the shared shell is ready.
- T025–T027 can run in parallel after the shared shell is ready.
- T029–T031 can run in parallel after the story-specific changes are complete.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for customer browsing and purchase navigation.
3. Validate signed-out Login visibility, My Tickets access, and payment continuity.
4. Stop and review before expanding to organizer and gate navigation.

### Incremental Delivery

1. Baseline the current app and record the missing navigation gaps.
2. Land the shared role-aware shell and auth/logout behavior.
3. Finish customer discovery, checkout, and ticket navigation.
4. Add organizer entry and create-event navigation.
5. Add gate entry and validation navigation.
6. Finish accessibility, responsive width checks, and regression validation.

### Parallel Team Strategy

With multiple developers:

1. One developer can complete the baseline audit while another prepares the shared shell plan.
2. After Phase 2, customer, organizer, and gate work can proceed in parallel.
3. A separate developer can own the accessibility/regression phase once the story phases land.

## Notes

- [P] tasks must touch different files or non-overlapping helper areas.
- All tasks are frontend-only and must preserve backend authority for authentication and authorization.
- Do not replace dynamic application data with Stitch mock values.
- Keep `docs/design/` unchanged.
