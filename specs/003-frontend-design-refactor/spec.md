# Feature Specification: Frontend Design Refactor

**Feature Branch**: `003-frontend-design-refactor`
**Created**: 2026-08-12
**Status**: Draft
**Input**: Refactor the existing Elite Tickets frontend according to the approved responsive design references while preserving business behavior and backend contracts.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover and purchase an event (Priority: P1)

As a customer, I can discover events, inspect an event, reserve tickets, submit simulated payment, and receive the correct approved or declined result in a responsive interface matching the references.

**Why this priority**: This is the primary product journey and must remain demonstrable end to end.

**Independent Test**: With seeded catalog data and a customer account, exercise home, event detail, checkout, approved payment, declined payment, and ticket navigation at mobile and desktop viewport sizes.

**Acceptance Scenarios**:

1. **Given** published events are available, **When** a customer opens home, **Then** event cards, search/navigation, loading, empty, and error states use the approved visual direction and live data.
2. **Given** a customer selects an event, **When** they open its detail page, **Then** artwork, title, date, venue, synopsis, availability, quantity controls, and purchase action are responsive without changing reservation rules.
3. **Given** a customer chooses a quantity, **When** approved simulated payment completes, **Then** existing contracts are used and the customer reaches an approved state with an issued ticket.
4. **Given** payment is declined, **When** the result is shown, **Then** recovery actions are available without false issuance or corrupted availability.

### User Story 2 - Manage, view, and share tickets (Priority: P1)

As a customer, I can view my tickets, open a ticket detail, display its secure QR code, and create a read-only sharing link.

**Why this priority**: Ticket access completes purchase and must not regress.

**Independent Test**: With an issued ticket, exercise My Tickets, ticket detail, and a shared-ticket URL at mobile and desktop widths, including loading and API errors.

**Acceptance Scenarios**:

1. **Given** issued tickets exist, **When** My Tickets opens, **Then** live tickets use the approved list/card hierarchy and controls.
2. **Given** a ticket opens, **When** its detail is viewed, **Then** identity, event, purchaser, QR, status, and sharing remain available and accessible.
3. **Given** sharing succeeds, **When** the generated link is copied and opened, **Then** it presents a read-only ticket without customer-only controls.

### User Story 3 - Create and manage organizer events (Priority: P2)

As an organizer, I can review events and create an event through the existing catalog-backed form while retaining draft, publish, validation, loading, and error behavior.

**Why this priority**: Organizer operations are required scope and have responsive references.

**Independent Test**: As an organizer, exercise `/organizer/events` and `/organizer/events/new` at both viewport classes, including catalog selection, draft, and publish.

**Acceptance Scenarios**:

1. **Given** an authorized organizer, **When** events opens, **Then** managed events, status/availability, navigation, and create action follow the approved responsive layout.
2. **Given** valid event details, **When** the organizer submits, **Then** existing validation and backend behavior are preserved.
3. **Given** a wrong-role user, **When** an organizer route opens, **Then** existing authentication/role guards block access.

### User Story 4 - Validate entry at the gate (Priority: P2)

As a gate operator, I can select an active event, scan or enter a credential, and see valid, invalid, already-used, or wrong-event results.

**Why this priority**: Gate validation protects the core event experience.

**Independent Test**: As a gate user, exercise camera/manual validation at mobile and desktop widths and map each backend result to its approved state.

**Acceptance Scenarios**:

1. **Given** an authorized operator and active event, **When** a credential is scanned or entered, **Then** the existing validation endpoint is called and a clear result appears.
2. **Given** VALID, INVALID, ALREADY_USED, or WRONG_EVENT, **When** rendered, **Then** the corresponding reference state communicates status, details, and next action.
3. **Given** camera denial/unavailability, **When** manual entry is used, **Then** manual validation remains usable and keyboard accessible.

### User Story 5 - Navigate safely across responsive states (Priority: P3)

As any role, I can use the refactored interface with keyboard navigation and understand loading, empty, validation, success, and failure states at supported sizes.

**Why this priority**: Accessibility and responsive behavior apply to every reference.

**Independent Test**: Run accessibility checks and keyboard-only journeys over all mapped routes at mobile and desktop dimensions.

**Acceptance Scenarios**:

1. **Given** either supported viewport, **When** a route opens, **Then** one responsive experience adapts layout without a separate page implementation.
2. **Given** pending, empty, invalid, or failed data, **When** the state appears, **Then** it is understandable and actionable where appropriate.
3. **Given** keyboard-only use, **When** forms, controls, links, scanner fallback, or share actions are operated, **Then** focus, labels, order, and feedback support completion.

## Clarifications

### Session 2026-08-12

- Q: Quantos pares responsivos aprovados devem ser tratados como uma única experiência? → A: Oito pares: Home, Event Detail, Checkout, My Tickets, Ticket Detail, Organizer Events, Create Event e Gate Scanner.
- Q: A refatoração pode alterar `apps/web/lib/api.ts`, `apps/web/lib/auth.ts`, contratos ou decisões de autorização para atender ao visual? → A: Não; somente apresentação e consumo dos contratos existentes podem mudar, sem alterar API, autenticação, autorização ou regras de negócio.
- Q: Quando tarefas compartilham `globals.css`, `components/ui`, testes ou outra área lógica, elas podem ser marcadas como paralelas? → A: Não; `[P]` só é permitido para tarefas com arquivos e dependências independentes, e tarefas compartilhadas devem aguardar a fundação comum.
- Q: Quais caminhos concretos devem ser usados para testes focados de checkout e Gate? → A: `apps/web/tests/unit/checkout-flow.test.tsx` e `apps/web/tests/unit/gate-validation.test.tsx`.
- Q: Como a cobertura de FR-014 e a revisão visual de SC-001 devem ser demonstradas? → A: Cada tarefa de E2E/acessibilidade deve rastrear FR-014, e SC-001 deve usar uma matriz dos 15 fluxos com critérios explícitos de bloqueio registrados na documentação de validação.

### Design reference and route mapping

Every `screen.png` is the primary visual target; its paired `code.html` informs structure, hierarchy, spacing, typography, responsive intent, and interactions. Example titles/values are not application data. Paired references are one responsive page/flow.

| Reference(s) | Flow | Existing route/state |
|---|---|---|
| `01_home` + `_desktop` | Customer discovery | `/` |
| `02_event_detail` + `_desktop` | Event detail/purchase | `/events/[eventId]` |
| `03_checkout` + `_desktop` | Checkout/order summary | `/customer/checkout/[eventId]` |
| `04_payment_approved` | Approved payment/ticket handoff | checkout success |
| `05_payment_declined` | Declined payment/recovery | checkout declined |
| `06_my_tickets` + `_desktop` | Ticket list | `/customer/tickets` |
| `07_ticket_detail` + `_desktop` | Ticket detail/QR/share | `/customer/tickets/[ticketId]` |
| `08_shared_ticket` | Public read-only ticket | `/shared/tickets/[shareToken]` |
| `09_organizer_events` + `_mobile` | Organizer event list | `/organizer/events` |
| `10_create_event` + `_mobile` | Event creation | `/organizer/events/new` |
| `11_gate_scanner` + `_desktop` | Scanner/manual entry | `/gate` |
| `12_valid` | Successful validation | `VALID` state |
| `13_invalid` | Invalid credential | `INVALID` state |
| `14_already_used` | Consumed ticket | `ALREADY_USED` state |
| `15_wrong_event` | Other event | `WRONG_EVENT` state |

The references establish a high-contrast dark editorial ticket/cinema language: accent color, uppercase display headings, compact data typography, strong borders, perforation/cutout motifs, and role-specific navigation. Screenshots win over paired HTML when they disagree; `DESIGN.md` remains the project visual authority and discrepancies must be recorded.

### Edge Cases

- No events, tickets, organizer events, or catalog results show intentional empty states.
- Slow/failed requests show feedback and never fabricate data.
- Invalid quantity, sold-out inventory, expired reservation, repeated payment, and declined payment preserve backend outcomes and prevent duplicate issuance.
- Missing, malformed, expired, or used QR credentials never authorize from predictable ticket IDs; different-event tickets return WRONG_EVENT.
- Camera failure leaves manual validation usable; unauthorized or wrong-role access remains blocked.
- Narrow screens avoid horizontal scrolling for primary content; wide screens use the desktop composition.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The frontend MUST visually conform to every listed screenshot, with each mobile/desktop pair implemented as one responsive flow.
- **FR-002**: The paired HTML MUST be used as reference material and MUST NOT be copied as static application HTML.
- **FR-003**: Event, catalog, reservation, payment, ticket, share, session, and validation values MUST continue to come from existing APIs/state.
- **FR-004**: Existing backend contracts, JWT authentication, role authorization, and business rules MUST remain unchanged unless incompatibility is documented.
- **FR-005**: Customers MUST retain discovery, detail, reservation, approved/declined payment, ticket, QR, and sharing flows.
- **FR-006**: Organizers MUST retain event management and catalog-backed create, draft, validation, and publish flows.
- **FR-007**: Gate users MUST retain event selection, scan/manual entry, and all four validation outcomes.
- **FR-008**: Loading, empty, error, validation, success, and recovery states MUST be preserved for every flow.
- **FR-009**: Repeated visual patterns SHOULD be reusable while retaining role-specific navigation and readable content.
- **FR-010**: Primary controls, forms, navigation, scanner fallback, QR/share actions, and feedback MUST remain keyboard accessible with labels and visible focus.
- **FR-011**: Responsive pairs MUST not require separate mobile and desktop routes/pages.
- **FR-012**: Secure ticket credentials MUST be preserved; QR validation MUST NOT be reduced to predictable IDs.
- **FR-013**: Files under `docs/design/` MUST NOT be modified.
- **FR-014**: Automated frontend tests MUST cover mapped routes, critical responsive states, purchase outcomes, sharing, role guards, gate outcomes, and accessibility regressions.
- **FR-015**: Refactoring MUST NOT modify `apps/web/lib/api.ts` or `apps/web/lib/auth.ts` in a way that changes API contracts, JWT/session behavior, role authorization, or backend decision-making; any presentation-only adjustment must preserve those boundaries.
- **FR-016**: Parallel implementation work MUST be limited to tasks with independent files and completed dependencies; tasks sharing `globals.css`, `components/ui`, route shells, or test files MUST be ordered sequentially after their shared foundation.
- **FR-017**: Focused checkout and Gate unit coverage MUST use the concrete files `apps/web/tests/unit/checkout-flow.test.tsx` and `apps/web/tests/unit/gate-validation.test.tsx`.

### Key Entities

- **Event**: Catalog-backed or organizer-managed event with artwork, schedule, venue, capacity, availability, and status.
- **Reservation**: Customer quantity hold and lifecycle before payment or expiry.
- **Payment**: Simulated approved/declined result tied to a reservation.
- **Ticket**: Issued admission credential with event, purchaser, status, secure QR, and share representation.
- **Shared ticket**: Read-only public representation addressed by a non-guessable token.
- **Validation result**: Backend-authoritative VALID, INVALID, ALREADY_USED, or WRONG_EVENT outcome.
- **User session**: Authenticated identity with Organizer, Customer, or Gate role.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 15 reference flows render on mapped routes and receive a screenshot-based visual review using a documented matrix; a blocking mismatch is any missing flow/state, broken primary interaction, wrong product behavior, unreadable content, or primary-content overflow.
- **SC-002**: All eight responsive pairs pass mobile, intermediate, and desktop checks without primary-content horizontal overflow.
- **SC-003**: Seeded customer purchase reaches an issued ticket; declined payment reaches recovery without issuance.
- **SC-004**: Seeded organizer can create/publish an event and seeded gate user can produce all four validation outcomes in automated tests.
- **SC-005**: Existing frontend end-to-end purchase, sharing, organizer, gate, and backend contract tests remain passing.
- **SC-006**: Keyboard-only users can complete login, discovery, checkout, ticket/share, event creation, and manual validation.
- **SC-007**: Loading, empty, error, success, declined, invalid, used, and wrong-event states each have an automated assertion or documented manual verification.

## Assumptions

- Existing Next.js routes, React components, API client, authentication, and backend contracts are the baseline.
- `PRD.md`, constitution, `DESIGN.md`, and `specs/001-event-ticket-mvp/` are authoritative; this is presentation/frontend composition work, not a backend rewrite.
- The requested `docs/product/PRD.md` maps to repository `PRD.md`, and the requested `specs/001-ticket-platform-mvp/` maps to `specs/001-event-ticket-mvp/`.
- Screenshot dimensions are approved reference points; responsive interpolation is allowed when hierarchy and interactions remain consistent.
- Mock text, images, prices, dates, counts, identities, and credentials in references are illustrative.
- No new role, payment provider, schema migration, or business rule is in scope.
- The branch hook was attempted but could not write `.git/index.lock` because this workspace is read-only for Git metadata.

## Conflicts and discrepancies

- Requested documentation paths differ from actual repository paths; the actual paths are used above.
- HTML examples contain values differing from seeded/live data; screenshots define visual intent, while APIs define content and behavior.
- Some desktop/mobile references differ in copy/decorative details; implementation must preserve each screenshot’s intent without duplicate routes.
- Any conflict between screenshots and `DESIGN.md` must be explicitly resolved during planning.
