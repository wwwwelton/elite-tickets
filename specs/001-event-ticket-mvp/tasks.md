# Tasks: MVP de Eventos e Ingressos

**Input**: Design documents from `/specs/001-event-ticket-mvp/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: Included because FR-034 and the project constitution require automated success, failure, authorization, inventory, concurrency, QR, issuance, and single-consumption verification.

**Organization**: Tasks are grouped by user story so each increment can be implemented and tested independently. Tests in each story are written first and must fail before implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it changes different files and has no dependency on another incomplete task in the same phase
- **[Story]**: Maps the task to a user story from `spec.md`
- Every task names the exact file or directory it changes

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the reproducible monorepo, local services, and verification toolchain.

- [X] T001 Create the Python 3.12 FastAPI package and pinned runtime/test dependencies in `apps/api/pyproject.toml`
- [X] T002 [P] Create the Next.js 15, React 19, and TypeScript application with pinned scripts and dependencies in `apps/web/package.json`
- [X] T003 [P] Configure strict TypeScript, Next.js, ESLint, and test path aliases in `apps/web/tsconfig.json`, `apps/web/next.config.ts`, and `apps/web/eslint.config.mjs`
- [X] T004 [P] Configure pytest markers for unit, integration, and PostgreSQL concurrency suites in `apps/api/pyproject.toml`
- [X] T005 Define PostgreSQL, migration, API, web, and an at-least-once-per-minute expiry runner reusing the API image, with health checks and dependency ordering in `compose.yaml`
- [X] T006 [P] Document safe runtime variables with distinct JWT/QR secrets, TMDb configuration, CORS origins, and public API URL in `.env.example`
- [X] T007 [P] Create deployment definitions for the FastAPI service, migration pre-deploy command, PostgreSQL, and a scheduled expiry command running at least once per minute in `infra/render.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared configuration, persistence, authentication, authorization, error handling, and frontend foundations required by every story.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [X] T008 Implement typed environment configuration with secret separation and safe validation in `apps/api/src/elite_tickets/shared/config.py`
- [X] T009 [P] Define the async SQLAlchemy engine, session factory, and transaction dependency in `apps/api/src/elite_tickets/db/session.py`
- [X] T010 [P] Define declarative base, UUIDv7/timestamp helpers, and enum conventions in `apps/api/src/elite_tickets/db/base.py`
- [X] T011 Configure Alembic metadata and database URL handling in `apps/api/alembic/env.py` and `apps/api/alembic.ini`
- [X] T012 Implement the User model, role enum, constraints, and indexes in `apps/api/src/elite_tickets/auth/models.py`
- [X] T013 Implement Argon2 password verification, short-lived JWT issuance/validation, active-user loading, role dependencies, and 401/403 behavior in `apps/api/src/elite_tickets/auth/security.py`
- [X] T014 Implement login request/response schemas and `POST /api/v1/auth/token` in `apps/api/src/elite_tickets/auth/router.py`
- [X] T015 [P] Implement domain/API exception mapping without sensitive token leakage in `apps/api/src/elite_tickets/shared/errors.py`
- [X] T016 [P] Implement structured redacting logging and request correlation middleware, including path/query redaction for share tokens, in `apps/api/src/elite_tickets/shared/logging.py`
- [X] T017 Assemble versioned routers, configured CORS, and `/health/live` plus database-backed `/health/ready` in `apps/api/src/elite_tickets/main.py`
- [X] T018 Create the initial User schema migration with required PostgreSQL extensions in `apps/api/alembic/versions/0001_users.py`
- [X] T019 [P] Implement a typed API client, bearer-token handling, normalized errors, and no-store mutation helpers in `apps/web/lib/api.ts`
- [X] T020 [P] Implement session persistence, role-aware navigation, protected layouts, and login UI in `apps/web/lib/auth.ts`, `apps/web/components/auth/login-form.tsx`, and `apps/web/app/login/page.tsx`
- [X] T021 [P] Implement the exact normative `DESIGN.md` color tokens, 12/4-column grids, zero-radius controls, typography roles, border hierarchy, ticket notches, perforation, ledger rows, and status primitives in `apps/web/app/globals.css` and `apps/web/components/ui/`
- [X] T022 Add authentication and role-authorization tests covering all three roles, inactive users, invalid JWTs, and 401/403 behavior in `apps/api/tests/integration/test_authorization.py`

**Checkpoint**: Database, API shell, authentication, role enforcement, error handling, and shared UI are ready.

---

## Phase 3: User Story 1 - Comprar e receber ingressos (Priority: P1) 🎯 MVP

**Goal**: A CUSTOMER discovers a published seeded event, atomically reserves tickets, receives a deterministic payment result, and sees exactly the issued tickets and QR credentials.

**Independent Test**: With one published seeded event, sign in as CUSTOMER, reserve two units, approve payment, and verify two owned tickets appear; separately verify decline and 15-minute expiry release inventory and issue nothing.

### Implementation for User Story 1

- [X] T028 [P] [US1] Implement Event and MovieSnapshot models with lifecycle and inventory constraints in `apps/api/src/elite_tickets/events/models.py`
- [X] T029 [P] [US1] Implement Reservation and SimulatedPayment models with immutable terminal states and idempotency constraints in `apps/api/src/elite_tickets/reservations/models.py`
- [X] T030 [P] [US1] Implement Ticket model, ordinal uniqueness, static JWS storage, nonce hash, and write-once usage fields in `apps/api/src/elite_tickets/tickets/models.py`
- [X] T031 [US1] Create Event, MovieSnapshot, Reservation, SimulatedPayment, and Ticket tables with checks and indexes in `apps/api/alembic/versions/0002_commerce.py`
- [X] T032 [P] [US1] Implement lazy event finalization and published event search/detail projections using saved snapshots in `apps/api/src/elite_tickets/events/service.py`
- [X] T033 [P] [US1] Implement signed static QR credential generation/verification with version, `kid`, nonce entropy, and dedicated secret in `apps/api/src/elite_tickets/tickets/credentials.py`
- [X] T034 [US1] Implement atomic conditional inventory reservation and idempotent pending-reservation expiry with fixed lock ordering in `apps/api/src/elite_tickets/reservations/service.py`
- [X] T035 [US1] Implement deterministic `tok_approved`/`tok_declined` processing, payload-bound idempotency, atomic counter transitions, and exact ticket issuance in `apps/api/src/elite_tickets/reservations/payment.py`
- [X] T036 [US1] Implement public event list/detail, CUSTOMER reservation, and owner-only payment endpoints matching `contracts/openapi.yaml` in `apps/api/src/elite_tickets/events/router.py` and `apps/api/src/elite_tickets/reservations/router.py`
- [X] T037 [US1] Implement owner-only ticket listing and QR-safe response serialization in `apps/api/src/elite_tickets/tickets/router.py`
- [X] T038 [P] [US1] Build public event search, cards, poster fallback, and event detail quantity controls in `apps/web/app/(public)/page.tsx`, `apps/web/app/(public)/events/[eventId]/page.tsx`, and `apps/web/components/events/`
- [X] T039 [US1] Build CUSTOMER checkout countdown, reservation creation, idempotent simulated payment, and approved/declined states in `apps/web/app/customer/checkout/[eventId]/page.tsx` and `apps/web/components/checkout/`
- [X] T040 [P] [US1] Build My Tickets list/detail with event, owner, state, identical QR/text credential, and cancellation fallback states in `apps/web/app/customer/tickets/page.tsx`, `apps/web/app/customer/tickets/[ticketId]/page.tsx`, and `apps/web/components/tickets/ticket.tsx`
- [X] T041 [US1] Implement idempotent demo seed data for all roles, credentials documentation output, and published purchase fixtures in `apps/api/src/elite_tickets/seed_demo.py`
- [X] T042 [US1] Implement an idempotent reservation-expiry CLI suitable for execution at least once per minute in `apps/api/src/elite_tickets/reservations/expire.py`

### Tests for User Story 1

- [X] T023 [P] [US1] Add anonymous published-event visibility, non-published direct-access denial, search, listing, and detail contract tests for `GET /events` and `GET /events/{eventId}` in `apps/api/tests/integration/test_public_events.py`
- [X] T024 [P] [US1] Add reservation validation, ownership, expiry, payment idempotency, approval/decline, exact ticket issuance, bounded expiry-CLI cleanup delay, and no-double-release tests in `apps/api/tests/integration/test_purchase_flow.py` and `apps/api/tests/integration/test_reservation_expiry.py`
- [X] T025 [P] [US1] Add independent-connection tests for last-unit reservation contention and payment-versus-expiry races in `apps/api/tests/concurrency/test_inventory.py`
- [X] T026 [P] [US1] Add unit tests for QR JWS entropy, fixed algorithm allowlist, signature tampering, nonce hashing, and credential redaction in `apps/api/tests/unit/test_qr_credentials.py`
- [X] T027 [P] [US1] Add a Chromium E2E for public discovery followed by CUSTOMER login, a two-unit approved purchase and My Tickets, then a declined reservation proving explicit decline, restored availability, immutable retry behavior, and no new ticket issuance in `apps/web/tests/e2e/customer-purchase.spec.ts`

- [X] T043 [US1] Verify the complete US1 API, expiry CLI, concurrency, and Playwright suites and record commands/results in `specs/001-event-ticket-mvp/validation/us1.md`

**Checkpoint**: The principal CUSTOMER value flow works end to end and independently of live TMDb access.

---

## Phase 4: User Story 2 - Criar e publicar evento de filme (Priority: P2)

**Goal**: An ORGANIZER searches TMDb, saves an immutable snapshot in a DRAFT event, publishes and monitors owned events, and can cancel them consistently.

**Independent Test**: Sign in as ORGANIZER, search/select a film, create and publish a valid event, confirm it appears publicly and in the owned-event ledger, then cancel it and verify pending inventory is released and tickets become cancelled; existing events remain usable while TMDb is unavailable.

### Implementation for User Story 2

- [X] T048 [P] [US2] Implement the backend-only TMDb adapter with timeout, bounded retry for timeout/429/5xx, Pydantic normalization, and typed unavailability in `apps/api/src/elite_tickets/catalog/tmdb.py`
- [X] T049 [US2] Implement ORGANIZER-owned event creation from a fetched snapshot, field/timezone/money validation, DRAFT publication, owned metrics, temporal finishing, and atomic cancellation in `apps/api/src/elite_tickets/events/organizer_service.py`
- [ ] T050 [US2] Implement ORGANIZER-only catalog search, event creation, publish, cancel, and owned-list endpoints matching `contracts/openapi.yaml` in `apps/api/src/elite_tickets/catalog/router.py` and `apps/api/src/elite_tickets/events/organizer_router.py`
- [ ] T051 [P] [US2] Build the organizer event ledger with capacity, sold, reserved-derived availability, state, publish, and cancel actions in `apps/web/app/organizer/events/page.tsx` and `apps/web/components/events/organizer-ledger.tsx`
- [ ] T052 [US2] Build movie search/select with loading, retryable TMDb failure, poster fallback, and validated event creation form in `apps/web/app/organizer/events/new/page.tsx` and `apps/web/components/events/event-form.tsx`

### Tests for User Story 2

- [ ] T044 [P] [US2] Add TMDb normalization, timeout/retry, missing-poster, and 503-without-partial-event tests in `apps/api/tests/integration/test_catalog.py`
- [ ] T045 [P] [US2] Add event validation, snapshot immutability, ownership, DRAFT publication, temporal finishing, and atomic cancellation tests in `apps/api/tests/integration/test_organizer_events.py`
- [ ] T046 [P] [US2] Add independent-connection PostgreSQL races for cancellation versus reservation, approval, decline, and expiry, proving a single terminal outcome, exact-once inventory release, no post-cancellation issuance, and non-negative bounded counters in `apps/api/tests/concurrency/test_event_cancellation.py`
- [ ] T047 [P] [US2] Add organizer creation/publication and TMDb retry UI tests in `apps/web/tests/e2e/organizer-events.spec.ts`

- [ ] T053 [US2] Verify US2 against snapshot continuity, ownership, cancellation, finishing, cancellation concurrency races, API tests, and browser flow and record results in `specs/001-event-ticket-mvp/validation/us2.md`

**Checkpoint**: The supply-side workflow is independently demonstrable and existing-event operations do not depend on TMDb availability.

---

## Phase 5: User Story 3 - Validar entrada com segurança (Priority: P3)

**Goal**: A GATE selects a published event and submits the same credential by camera or text for an online-only, atomic, explicitly classified validation.

**Independent Test**: For a selected event, submit valid, tampered, already-used, and other-event credentials and receive `VALID`, `INVALID`, `ALREADY_USED`, and `WRONG_EVENT`; 100 simultaneous attempts yield exactly one `VALID`, and API unavailability never displays admission.

### Implementation for User Story 3

- [ ] T057 [P] [US3] Implement TicketValidation model and result enum with auditable attempt fields in `apps/api/src/elite_tickets/tickets/validation_models.py`
- [ ] T058 [US3] Create the TicketValidation table and lookup indexes in `apps/api/alembic/versions/0003_ticket_validations.py`
- [ ] T059 [US3] Implement signature/nonce eligibility checks and atomic `used_at IS NULL` consumption with non-mutating result classification and same-transaction attempt logging in `apps/api/src/elite_tickets/tickets/validation_service.py`
- [ ] T060 [US3] Implement GATE-only published-event selection and validation endpoints matching `contracts/openapi.yaml` in `apps/api/src/elite_tickets/tickets/gate_router.py`
- [ ] T061 [P] [US3] Build camera scanning with explicit permission/error states and manual credential input feeding one online validation action in `apps/web/app/gate/page.tsx` and `apps/web/components/tickets/scanner.tsx`
- [ ] T062 [US3] Build accessible `VALID`, `INVALID`, `ALREADY_USED`, `WRONG_EVENT`, and backend-unavailable results that never infer offline admission in `apps/web/components/tickets/validation-result.tsx`

### Tests for User Story 3

- [ ] T054 [P] [US3] Add integration tests for role enforcement, event eligibility, all four validation results, attempt logging, and non-consumption on failure in `apps/api/tests/integration/test_gate_validation.py`
- [ ] T055 [P] [US3] Add independent-connection tests for 100 same-ticket validations proving exactly one `VALID` and all applicable remainder `ALREADY_USED`, plus cancellation racing validation proving no post-cancellation consumption, in `apps/api/tests/concurrency/test_ticket_validation.py`
- [ ] T056 [P] [US3] Add scanner/manual equivalence, camera fallback, four result states, and offline refusal browser tests in `apps/web/tests/e2e/gate-validation.spec.ts`

- [ ] T063 [US3] Verify all GATE result, tampering, cancellation/finish, concurrency, and offline scenarios and record results in `specs/001-event-ticket-mvp/validation/us3.md`

**Checkpoint**: Entry validation is online-only, secure against tampering, and single-consumption under contention.

---

## Phase 6: User Story 4 - Compartilhar ingresso sem transferi-lo (Priority: P4)

**Goal**: A CUSTOMER creates a distinct unpredictable public share link that displays a ticket without transferring ownership or granting management rights and expires on use or event end.

**Independent Test**: Generate a share as the ticket owner, open it anonymously, verify the ticket and QR are visible with no owner action, confirm ownership is unchanged, then consume the ticket or pass event end and receive an expired response.

### Implementation for User Story 4

- [ ] T066 [P] [US4] Implement TicketShare model with one-per-ticket and unique hashed-token constraints in `apps/api/src/elite_tickets/tickets/share_models.py`
- [ ] T067 [US4] Create the TicketShare table and token hash indexes in `apps/api/alembic/versions/0004_ticket_shares.py`
- [ ] T068 [US4] Implement owner-only CSPRNG share generation and anonymous read-only lookup with used/status/event-end validity checks in `apps/api/src/elite_tickets/tickets/share_service.py`
- [ ] T069 [US4] Implement owner share creation and public shared-ticket endpoints with limited serializers, `Cache-Control: no-store`, and `Referrer-Policy: no-referrer` matching `contracts/openapi.yaml` in `apps/api/src/elite_tickets/tickets/share_router.py`
- [ ] T070 [P] [US4] Add owner share action/copy feedback and anonymous read-only ticket rendering with no management controls, `no-store`, and `no-referrer` in `apps/web/components/tickets/share-action.tsx` and `apps/web/app/shared/tickets/[shareToken]/page.tsx`

### Tests for User Story 4

- [ ] T064 [P] [US4] Add share entropy/hash, ownership, idempotent retrieval, QR-token separation, anonymous read, use/end expiry, `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, and URL-token redaction tests in `apps/api/tests/integration/test_ticket_sharing.py`
- [ ] T065 [P] [US4] Add anonymous shared-ticket display and expired-link browser tests in `apps/web/tests/e2e/ticket-sharing.spec.ts`

- [ ] T071 [US4] Verify anonymous access, unchanged ownership, token separation, and both expiry conditions and record results in `specs/001-event-ticket-mvp/validation/us4.md`

**Checkpoint**: Sharing works without authentication, ownership transfer, management privileges, or QR/share credential confusion.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Prove deployment readiness, accessibility, security, performance, and documented reproducibility across all stories.

- [ ] T072 [P] Add frontend unit tests for timers, API failure states, role navigation, poster fallback, QR/text equality, and accessibility in `apps/web/tests/unit/`
- [ ] T073 [P] Add API response-time smoke tests for event search/detail demonstration targets in `apps/api/tests/integration/test_performance_smoke.py`
- [ ] T074 Audit keyboard navigation, focus visibility, status announcements, reduced motion, AA contrast, responsive 12/4-column grids, camera fallback, exact `#000000` canvas and `#E61919` CTA, zero-radius/no-shadow styling, typography roles, and non-color-only states against `DESIGN.md` in `apps/web/tests/e2e/accessibility.spec.ts`
- [ ] T075 Run dependency/security checks and inspect logs/build artifacts for JWT, QR, share, TMDb, database, or password leakage; record findings in `specs/001-event-ticket-mvp/validation/security.md`
- [ ] T076 Validate fresh `docker compose` build, health checks, migrations, repeatable seed, local at-least-once-per-minute expiry runner, all API and PostgreSQL concurrency suites including event-cancellation races, frontend tests, and Chromium E2E; statically verify the equivalent schedule in `infra/render.yaml`, and record deployed Render smoke evidence only when deployment access is available, exactly as documented in `specs/001-event-ticket-mvp/quickstart.md`
- [ ] T077 Update local/deployment walkthrough, demo accounts, safe simulated tokens, expiry command, and troubleshooting in `README.md`
- [ ] T078 Record final requirement, contract, constitution, visual-reference, and generated-code review evidence in `specs/001-event-ticket-mvp/validation/final.md`
- [ ] T079 Add cross-user resource-ownership tests for ORGANIZER events, CUSTOMER reservations/tickets/shares, and GATE validation access in `apps/api/tests/integration/test_resource_ownership.py`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: Starts immediately.
- **Phase 2 — Foundational**: Depends on Phase 1 and blocks every user story.
- **Phase 3 — US1**: Depends on Phase 2. This is the MVP and supplies issued tickets/events used as fixtures by later stories.
- **Phase 4 — US2**: Depends on Phase 2 plus the Event, MovieSnapshot, Reservation, SimulatedPayment, and Ticket schema delivered in US1; seeded fixtures support its independent acceptance flow after that schema exists.
- **Phase 5 — US3**: Depends on Phase 2 plus the Event and Ticket schema delivered in US1.
- **Phase 6 — US4**: Depends on Phase 2 plus the Ticket schema delivered in US1; it can proceed in parallel with US3.
- **Phase 7 — Polish**: Depends on every story selected for the release.

### User Story Dependency Graph

```text
Setup → Foundational → US1 (purchase and issuance) ─┬→ US2 (organizer supply)
                                                    ├→ US3 (validation)
                                                    └→ US4 (sharing)

US1 + US2 + US3 + US4 → Polish and full walkthrough
```

### Within Each User Story

1. Apply schema/model changes before dependent services.
2. Implement services before exposing endpoints.
3. Integrate frontend components after stable API behavior exists.
4. Add the listed automated tests only after their required behavior exists, and require them to pass before completion.
5. Run the story checkpoint and save evidence before starting the next sequential priority.

### Parallel Opportunities

- Setup tasks T002–T004 and T006–T007 can run concurrently after T001 where applicable.
- Foundational tasks marked `[P]` can be split across API and web after their package initialization.
- US1 models T028–T030 can be implemented concurrently; UI tasks T038 and T040 can proceed once their APIs are stable; tests T023–T027 can run concurrently after the required US1 behavior exists.
- US2 adapter T048 and organizer UI T051 can proceed concurrently once contracts are understood; tests T044–T047 run in separate files after the required US2 behavior exists.
- US3 scanner UI T061 can proceed alongside the backend model/migration work; tests T054–T056 are independent after the required US3 behavior exists.
- US4 model T066 and UI T070 can proceed after the shared Ticket contract is stable; tests T064–T065 are independent after the required US4 behavior exists.
- After US1 establishes the shared commerce schema, US2, US3, and US4 can be assigned in parallel using seeded fixtures where appropriate.

## Parallel Execution Examples

### User Story 1

```text
Task T023: Public event contract tests in apps/api/tests/integration/test_public_events.py
Task T024: Purchase integration tests in apps/api/tests/integration/test_purchase_flow.py
Task T025: Inventory concurrency tests in apps/api/tests/concurrency/test_inventory.py
Task T026: QR unit tests in apps/api/tests/unit/test_qr_credentials.py
Task T027: CUSTOMER browser flow in apps/web/tests/e2e/customer-purchase.spec.ts
```

### User Story 2

```text
Task T044: TMDb failure/normalization tests in apps/api/tests/integration/test_catalog.py
Task T045: Organizer event lifecycle tests in apps/api/tests/integration/test_organizer_events.py
Task T046: Event cancellation race tests in apps/api/tests/concurrency/test_event_cancellation.py
Task T047: Organizer browser flow in apps/web/tests/e2e/organizer-events.spec.ts
```

### User Story 3

```text
Task T054: Gate result integration tests in apps/api/tests/integration/test_gate_validation.py
Task T055: Single-consumption concurrency proof in apps/api/tests/concurrency/test_ticket_validation.py
Task T056: Camera/manual/offline browser tests in apps/web/tests/e2e/gate-validation.spec.ts
```

### User Story 4

```text
Task T064: Share security and expiry tests in apps/api/tests/integration/test_ticket_sharing.py
Task T065: Anonymous share browser tests in apps/web/tests/e2e/ticket-sharing.spec.ts
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Setup and Foundational phases.
2. Complete US1 against the seeded published event.
3. Stop and run its API, PostgreSQL concurrency, and Chromium E2E checks.
4. Demo discovery → reservation → approved payment → two issued tickets.

### Incremental Delivery

1. **US1** proves the commercial core with seeded supply.
2. **US2** replaces seeded-only supply with organizer creation, publication, lifecycle, and TMDb resilience.
3. **US3** closes the admission loop with atomic single use.
4. **US4** adds safe public presentation without ownership transfer.
5. Polish validates the full Docker Compose and production-oriented walkthrough.

### Scope Discipline

- Keep one FastAPI monolith, one Next.js frontend, and one PostgreSQL database.
- Do not add microservices, queues, Redis, GraphQL, real payments, offline validation, seat maps, or transfer/revocation flows.
- Treat `spec.md` as behavioral truth, `plan.md` as technical truth, and `DESIGN.md` as visual truth.
- Never consider a task complete until its generated code has been reviewed, executed, and tested.

## Notes

- `[P]` means the task is safe to implement concurrently within its phase based on file and dependency boundaries.
- User-story labels provide traceability to acceptance scenarios and FRs.
- PostgreSQL, not SQLite or mocks, must prove critical locking and contention behavior.
- Never log full JWTs, QR credentials, share tokens, passwords, or TMDb/database secrets.
- Commit only reviewed, executed, and passing logical increments.
