# Tasks: Complete Ticketing Frontend

**Input**: Design documents from `/specs/005-complete-ticketing-frontend/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create the frontend application shell files under `apps/web/app/layout.tsx` and `apps/web/app/page.tsx` with the route structure described in `specs/005-complete-ticketing-frontend/plan.md`
- [X] T002 Initialize shared frontend tooling and scripts in `apps/web/package.json` so local development, linting, and tests can run consistently
- [X] T003 [P] Establish the shared design token and layout foundation in `apps/web/app/globals.css` and `apps/web/components/shell/site-shell.tsx`
- [X] T004 [P] Add the frontend API client and token/session helpers in `apps/web/lib/api.ts` and `apps/web/lib/auth.ts` for the verified backend contract surface in `specs/005-complete-ticketing-frontend/contracts/openapi.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Define the shared authenticated session model and role routing behavior in `apps/web/lib/auth.ts`
- [X] T006 [P] Create the shared backend data mappers for events, reservations, tickets, shares, and gate validation results in `apps/web/lib/mappers.ts`
- [X] T007 [P] Add the public application routes and role entry points in `apps/web/app/login/page.tsx`, `apps/web/app/register/page.tsx`, `apps/web/app/shared/tickets/[shareToken]/page.tsx`, `apps/web/app/customer/page.tsx`, `apps/web/app/organizer/page.tsx`, and `apps/web/app/gate/page.tsx`
- [X] T008 Configure shared loading, empty, error, and unauthorized state components in `apps/web/components/states/` for reuse across all stories
- [X] T009 Set up baseline frontend tests and fixtures in `apps/web/tests/setup.ts` and `apps/web/tests/fixtures/` for API-mocking and route rendering

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Discover and start purchase as a Customer (Priority: P1) 🎯 MVP

**Goal**: Let a visitor browse, search, and open public event details with the correct ordering and responsive states.

**Independent Test**: Open the home page, confirm nearest-date-first ordering, search behavior, and responsive event detail rendering on mobile and desktop.

### Tests for User Story 1

- [X] T010 [P] [US1] Add route-level tests for public discovery and event detail rendering in `apps/web/tests/public-events.test.tsx`
- [X] T011 [US1] Add search and ordering coverage for the public event list in `apps/web/tests/public-events.test.tsx`

### Implementation for User Story 1

- [X] T012 [US1] Implement the home page event discovery route in `apps/web/app/page.tsx`
- [ ] T013 [P] [US1] Implement the public event list UI in `apps/web/components/events/event-list.tsx`
- [ ] T014 [US1] Implement the public event search UI in `apps/web/components/events/event-search.tsx`
- [ ] T015 [P] [US1] Implement the event card presentation component in `apps/web/components/events/event-card.tsx`
- [ ] T016 [US1] Implement the event detail presentation component in `apps/web/components/events/event-detail.tsx`
- [ ] T017 [US1] Wire the public event page to the verified `GET /api/v1/events` and `GET /api/v1/events/{eventId}` contracts in `apps/web/lib/api.ts`
- [ ] T018 [US1] Add the signed-out purchase entry behavior and prompt to log in or create an account in `apps/web/app/events/[eventId]/page.tsx`

**Checkpoint**: User Story 1 should now be fully functional and testable independently

---

## Phase 4: User Story 2 - Sign in, register, and reach the right role experience (Priority: P1)

**Goal**: Let users sign in and land in the correct role experience while exposing the customer registration dependency clearly.

**Independent Test**: Sign in as each role, confirm the correct landing page, and verify registration shows the verified backend state or dependency notice.

### Tests for User Story 2

- [ ] T019 [P] [US2] Add authentication and role-routing tests in `apps/web/tests/auth-routing.test.tsx`
- [ ] T020 [US2] Add customer registration dependency-state coverage in `apps/web/tests/auth-routing.test.tsx`

### Implementation for User Story 2

- [ ] T021 [US2] Implement the shared login page with role-specific entry choices in `apps/web/app/login/page.tsx`
- [ ] T022 [US2] Implement the customer registration page or dependency state in `apps/web/app/register/page.tsx`
- [ ] T023 [P] [US2] Implement post-login role redirects and logout handling in `apps/web/lib/auth.ts`
- [ ] T024 [P] [US2] Add authenticated navigation and header actions for logout and role entry in `apps/web/components/navigation/site-nav.tsx`
- [ ] T025 [US2] Implement unauthorized and wrong-role state handling for protected routes in `apps/web/app/(protected)/unauthorized/page.tsx`

**Checkpoint**: User Story 2 should now be fully functional and testable independently

---

## Phase 5: User Story 3 - Reserve tickets and complete simulated checkout (Priority: P1)

**Goal**: Let a Customer select tickets using the supported allocation mode, review the order, and complete approved or declined simulated payment.

**Independent Test**: Create a reservation, review the order, complete approved payment, and repeat with declined payment while preserving reservation semantics.

### Tests for User Story 3

- [ ] T026 [P] [US3] Add reservation and checkout flow tests in `apps/web/tests/checkout-flow.test.tsx`
- [ ] T027 [US3] Add ticket-selection state coverage for quantity-based and supported allocation-mode rendering in `apps/web/tests/checkout-flow.test.tsx`

### Implementation for User Story 3

- [ ] T028 [US3] Implement the ticket selection and reservation flow in `apps/web/app/events/[eventId]/reserve/page.tsx`
- [ ] T029 [P] [US3] Implement the order review and simulated payment UI in `apps/web/app/customer/checkout/[reservationId]/page.tsx`
- [ ] T030 [P] [US3] Implement the checkout and reservation state components in `apps/web/components/checkout/checkout-summary.tsx` and `apps/web/components/checkout/payment-state.tsx`
- [ ] T031 [US3] Wire reservation creation and payment submission to `POST /api/v1/events/{eventId}/reservations` and `POST /api/v1/reservations/{reservationId}/payment` in `apps/web/lib/api.ts`
- [ ] T032 [US3] Add approved, declined, conflict, and recovery handling for checkout outcomes in `apps/web/app/customer/checkout/[reservationId]/page.tsx`

**Checkpoint**: User Story 3 should now be fully functional and testable independently

---

## Phase 6: User Story 4 - Manage tickets, QR, and sharing (Priority: P1)

**Goal**: Let a Customer review tickets, open ticket detail, show a secure QR credential, and share the ticket through a public link.

**Independent Test**: Open My Tickets, open a ticket detail, create a share link, and load the shared ticket view without exposing private account data.

### Tests for User Story 4

- [ ] T033 [P] [US4] Add My Tickets, ticket detail, and share-link rendering tests in `apps/web/tests/tickets-and-sharing.test.tsx`
- [ ] T034 [US4] Add secure QR and read-only shared ticket state coverage in `apps/web/tests/tickets-and-sharing.test.tsx`

### Implementation for User Story 4

- [ ] T035 [US4] Implement the My Tickets route in `apps/web/app/customer/tickets/page.tsx`
- [ ] T036 [P] [US4] Implement the ticket detail route and QR presentation in `apps/web/app/customer/tickets/[ticketId]/page.tsx`
- [ ] T037 [P] [US4] Implement the shared ticket route in `apps/web/app/shared/tickets/[shareToken]/page.tsx`
- [ ] T038 [US4] Implement ticket, share, and QR data rendering components in `apps/web/components/tickets/ticket-card.tsx`, `apps/web/components/tickets/ticket-detail.tsx`, `apps/web/components/tickets/share-link.tsx`, and `apps/web/components/tickets/qr-code.tsx`
- [ ] T039 [US4] Wire My Tickets, ticket share creation, and shared ticket retrieval to `GET /api/v1/me/tickets`, `POST /api/v1/me/tickets/{ticketId}/share`, and `GET /api/v1/shared/tickets/{shareToken}` in `apps/web/lib/api.ts`

**Checkpoint**: User Story 4 should now be fully functional and testable independently

---

## Phase 7: User Story 5 - Manage events and validate entry as Organizer and Gate Staff (Priority: P1)

**Goal**: Let an Organizer create, publish, and cancel events and let Gate Staff validate tickets quickly with all backend result states.

**Independent Test**: Sign in as Organizer to manage events and as Gate Staff to validate tickets, including valid, invalid, already-used, and wrong-event outcomes.

### Tests for User Story 5

- [ ] T040 [P] [US5] Add organizer events and gate validation tests in `apps/web/tests/organizer-and-gate.test.tsx`
- [ ] T041 [US5] Add catalog search, publish/cancel, and validation state coverage in `apps/web/tests/organizer-and-gate.test.tsx`

### Implementation for User Story 5

- [ ] T042 [US5] Implement the organizer events dashboard in `apps/web/app/organizer/events/page.tsx`
- [ ] T043 [P] [US5] Implement the external catalog search and selection flow in `apps/web/app/organizer/catalog/page.tsx`
- [ ] T044 [P] [US5] Implement the organizer create and review flow in `apps/web/app/organizer/events/new/page.tsx`
- [ ] T045 [US5] Implement organizer publish and cancel actions in `apps/web/app/organizer/events/page.tsx`
- [ ] T046 [US5] Implement the gate event selection and validation scanner experience in `apps/web/app/gate/page.tsx`
- [ ] T047 [P] [US5] Implement the gate validation outcome states and manual fallback components in `apps/web/components/gate/gate-status.tsx` and `apps/web/components/gate/manual-entry.tsx`
- [ ] T048 [US5] Wire organizer and gate pages to `GET /api/v1/organizer/events`, `GET /api/v1/catalog/events`, `GET /api/v1/catalog/events/{external_id}`, `POST /api/v1/events`, `POST /api/v1/events/{eventId}/publish`, `POST /api/v1/events/{eventId}/cancel`, `GET /api/v1/gate/events`, and `POST /api/v1/gate/events/{eventId}/validate` in `apps/web/lib/api.ts`

**Checkpoint**: User Story 5 should now be fully functional and testable independently

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T049 [P] Reconcile shared navigation, shell, and responsive behavior across `apps/web/components/shell/site-shell.tsx` and `apps/web/app/layout.tsx`
- [ ] T050 [P] Tighten accessibility labels, focus order, reduced-motion behavior, and contrast across `apps/web/components/` and `apps/web/app/`
- [ ] T051 [P] Align loading, empty, error, conflict, and success states across all flows in `apps/web/components/states/`
- [ ] T052 Run the validation scenarios from `specs/005-complete-ticketing-frontend/quickstart.md` against the implemented frontend
- [ ] T053 Review and update frontend documentation references in `specs/005-complete-ticketing-frontend/quickstart.md` if any route behavior changed during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Final Phase)**: Depends on completion of the desired user stories

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - may reuse the shared auth shell but remains independently testable
- **User Story 3 (P1)**: Can start after Foundational - depends on the shared event detail and session helpers
- **User Story 4 (P1)**: Can start after Foundational - depends on the shared ticket rendering and session helpers
- **User Story 5 (P1)**: Can start after Foundational - depends on the shared auth shell and API client

### Within Each User Story

- Tests should be written before or alongside implementation when present
- Shared shell and helpers before story-specific pages
- Story-specific routes before story-specific refinements
- Each story must be independently demonstrable at its checkpoint

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel after `T001` and `T002`
- Foundational tasks marked [P] can run in parallel once the shell exists
- Within each user story, page and component tasks marked [P] can run in parallel if they touch different files
- Stories 2 through 5 can proceed in parallel after the foundational work is complete, provided shared files are not being edited simultaneously

## Parallel Example: User Story 1

```bash
Task: "Add route-level tests for public discovery and event detail rendering in `apps/web/tests/public-events.test.tsx`"
Task: "Add search and ordering coverage for the public event list in `apps/web/tests/public-events.test.tsx`"
Task: "Implement the public event list and search UI in `apps/web/components/events/`"
Task: "Implement the event card and event detail presentation components in `apps/web/components/events/`"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate public discovery and event detail independently

### Incremental Delivery

1. Deliver public discovery first
2. Add authentication and role routing
3. Add reservation and checkout
4. Add tickets, QR, and sharing
5. Add organizer and gate operations
6. Finish with shared polish and accessibility hardening

### Parallel Team Strategy

1. One developer can own the public discovery and auth shell
2. Another can own checkout and tickets
3. Another can own organizer and gate flows
4. Shared shell changes should be sequenced to avoid file conflicts

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing if you adopt TDD
- Keep shared helper work in earlier phases to minimize rework
