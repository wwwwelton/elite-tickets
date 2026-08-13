# Feature Specification: Complete Ticketing Frontend

**Feature Branch**: `005-complete-ticketing-frontend`
**Created**: 2026-08-13
**Status**: Draft
**Input**: User description: "Create a NEW GitHub Spec Kit feature specification for Elite Tickets."

## Actors and Personas

- **Customer**: discovers events, signs in or registers, reserves tickets, completes simulated checkout, views tickets, and shares them.
- **Organizer**: signs in, searches the external catalog, creates events, publishes or cancels events, and manages organizer-owned inventory.
- **Gate Staff**: signs in, selects an event, validates tickets, and resolves entry status quickly and accurately.
- **Visitor**: browses public event discovery, event detail pages, and shared ticket links without protected access.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover and start purchase as a Customer (Priority: P1)

As a Customer, I can browse upcoming published events, search them, open a detail page, and begin purchase from a responsive public experience.

**Why this priority**: Event discovery is the entry point for the whole product and must work before any protected flow matters.

**Independent Test**: Open the home page as a signed-out visitor, verify event ordering, search behavior, loading/empty/error states, and open an event detail page on mobile and desktop widths.

**Acceptance Scenarios**:

1. **Given** published events exist, **When** I open the home page, **Then** I see published upcoming events ordered by the nearest future start datetime first.
2. **Given** a search term is entered, **When** results return, **Then** the matching events remain ordered by the nearest relevant upcoming start datetime first.
3. **Given** I open an event detail page, **When** the page loads, **Then** I can see verified event data including title, poster, date, time, venue, price, and availability cues when the backend provides them.
4. **Given** I am signed out, **When** I try to start a purchase, **Then** I am prompted to log in or create an account before continuing.

### User Story 2 - Sign in, register, and reach the right role experience (Priority: P1)

As a user, I can sign in once and be directed to the correct role experience, and as a new Customer I can create an account if registration is supported by the backend.

**Why this priority**: Authentication is required for purchase, organizer work, and gate validation, and the product must not fake unsupported account creation.

**Independent Test**: Exercise login for all three roles, attempt customer registration, and verify the post-auth destination and logout behavior.

**Acceptance Scenarios**:

1. **Given** valid Customer credentials, **When** I sign in, **Then** I reach the Customer home experience and can continue shopping.
2. **Given** valid Organizer credentials, **When** I sign in, **Then** I reach the Organizer events experience.
3. **Given** valid Gate Staff credentials, **When** I sign in, **Then** I reach the Gate event selection experience.
4. **Given** I am a new Customer, **When** I choose create account, **Then** I see the registration experience required by the actual backend contract or a clearly labeled backend dependency if registration is not yet available.
5. **Given** I am authenticated, **When** I sign out, **Then** the current session is cleared and I return to the public experience.

### User Story 3 - Reserve tickets and complete simulated checkout (Priority: P1)

As a Customer, I can select tickets using the backend-supported allocation mode, review the order, pay with a simulated payment step, and receive either an approved or declined result.

**Why this priority**: Purchase is the core business transaction and must be honest about what the backend can actually support today.

**Independent Test**: From an event detail page, create a reservation, proceed through review, complete approved payment, and repeat with a declined payment at both mobile and desktop sizes.

**Acceptance Scenarios**:

1. **Given** the event supports quantity-based selection, **When** I choose a quantity and confirm, **Then** I can create a reservation within the backend-defined limits and see the reservation summary.
2. **Given** the event exposes seat or sector allocation data through the verified backend contract, **When** I select tickets, **Then** the interface uses only the supported allocation mode and does not fabricate live availability.
3. **Given** I reach checkout, **When** I review the order, **Then** I see event, date/time, venue, selected seats or quantity, unit price, quantity, and total before finalizing payment.
4. **Given** simulated payment is approved, **When** the backend responds accordingly, **Then** I see a success state and a path to my tickets.
5. **Given** simulated payment is declined, **When** the backend responds accordingly, **Then** I see a failure state that preserves the reservation semantics and offers a supported next action.

### User Story 4 - Manage tickets, QR, and sharing (Priority: P1)

As a Customer, I can view my tickets, open a ticket detail, present a secure QR code, and create a shareable public ticket link.

**Why this priority**: Ticket access is the direct outcome of purchase and must remain secure and usable.

**Independent Test**: Sign in as a Customer, open My Tickets, open a ticket detail, create a share link, and open the shared ticket view.

**Acceptance Scenarios**:

1. **Given** I have tickets, **When** I open My Tickets, **Then** I see a list of my real tickets with loading, empty, and error states.
2. **Given** I open a ticket detail page, **When** the ticket is displayed, **Then** I can see the event identity, date/time, venue, ticket status, seat or sector when available, and a QR code.
3. **Given** I share a ticket, **When** a share link is created, **Then** I can open a public shared ticket view that avoids unnecessary private account data.
4. **Given** a QR credential is shown, **When** it is rendered, **Then** the UI does not imply that ticket validity is based on a predictable ticket ID alone.

### User Story 5 - Manage events and validate entry as Organizer and Gate Staff (Priority: P1)

As an Organizer or Gate Staff user, I can complete the role-specific operational flow without losing backend authority or speed.

**Why this priority**: The product only works end to end if events can be created and tickets can be validated at the door.

**Independent Test**: Sign in as an Organizer to create, publish, and cancel events; sign in as Gate Staff to select events and validate tickets, including all validation outcomes.

**Acceptance Scenarios**:

1. **Given** I am an Organizer, **When** I open organizer events, **Then** I see my events with supported status, sold inventory, available inventory, publish, cancel, and create actions.
2. **Given** I create a new event, **When** I use the external catalog search and complete the form, **Then** only backend-supported event fields are required and the event can be published or canceled afterward.
3. **Given** I am Gate Staff, **When** I select an event and validate a ticket, **Then** I can see VALID, INVALID, ALREADY USED, and WRONG EVENT outcomes.
4. **Given** camera access is unavailable, **When** I validate at the gate, **Then** manual entry remains available and usable without hiding the current event.

## Edge Cases

- No published events are available.
- Search returns no matches.
- An event is not found or is no longer publicly visible.
- The user tries to use a protected area while signed out.
- The user opens a protected area with the wrong role.
- The backend rejects a stale reservation, an expired session, or a conflicting inventory request.
- Payment is declined after a reservation is created.
- My Tickets is empty.
- A shared ticket token is invalid or expired according to backend behavior.
- A QR credential is invalid, already used, or belongs to another event.
- Camera access is denied or unavailable at the gate.
- Network or API errors interrupt discovery, checkout, ticket, organizer, or gate flows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The public experience MUST expose event discovery, search, login, customer registration entry, organizer entry, and gate entry without overwhelming the customer navigation.
- **FR-002**: Published upcoming events MUST appear in ascending upcoming event start datetime order, with the nearest upcoming event first.
- **FR-003**: Search MUST use only backend-supported query or filter behavior and MUST preserve the relevant nearest-date-first ordering.
- **FR-004**: Event cards and event detail views MUST show verified backend data when available, including poster or hero media, title, date, time, venue or location, price, and availability cues.
- **FR-005**: The event detail view MUST present the correct primary action based on authentication and role state.
- **FR-006**: A signed-out Customer MUST be prompted to log in or create an account before purchase can continue.
- **FR-007**: A signed-in Customer MUST be able to access ticket selection, checkout, My Tickets, ticket detail, sharing, and logout.
- **FR-008**: The login experience MUST support Customer, Organizer, and Gate Staff entry using the backend token login contract.
- **FR-009**: After authentication, the user MUST be directed to the correct role experience, and the backend role claim MUST remain authoritative.
- **FR-010**: The frontend MUST provide a Customer registration experience, but it MUST explicitly record a backend dependency if no verified registration contract exists.
- **FR-011**: If registration is supported by the backend, the registration experience MUST include validation, loading, error, and success states that reflect the verified backend behavior.
- **FR-012**: If registration is not supported by the backend, the UI MUST not fake a successful account creation and MUST instead show a clearly labeled dependency state.
- **FR-013**: Ticket selection MUST use only the backend-supported allocation mode for the event and MUST not fabricate live seat or sector availability.
- **FR-014**: The ticket selection experience MUST show selected items, unit price, quantity or seats, total price, and backend-defined limits before reservation is created.
- **FR-015**: Reservation creation MUST use the verified reservation request schema and MUST show loading, success, and conflict handling states.
- **FR-016**: Checkout MUST present a clear order review before payment and MUST state that payment is simulated.
- **FR-017**: Payment MUST support approved and declined outcomes and MUST preserve reservation semantics when payment is declined.
- **FR-018**: Approved payment MUST lead to a clear success state with access to My Tickets or ticket detail.
- **FR-019**: Declined payment MUST lead to a clear failure state with a recoverable next action supported by the backend state.
- **FR-020**: My Tickets MUST list the authenticated Customer's real tickets and MUST include loading, empty, and error states.
- **FR-021**: Ticket detail MUST present event identity, date/time, venue, status, seat or sector when available, a secure QR code, and a share action.
- **FR-022**: Shared ticket views MUST be public, read-only, and must not expose unnecessary private account data.
- **FR-023**: Organizer events MUST support viewing owned events, creating an event, publishing an event, and canceling an event using only the verified backend contracts.
- **FR-024**: Organizer event creation MUST include the external catalog search and detail flow supported by the backend and MUST not invent unsupported event fields.
- **FR-025**: Organizer event lists MUST show supported real information such as title, date/time, publication status, sold inventory, available inventory, and price.
- **FR-026**: Gate event selection MUST show only events available for gate validation and MUST lead into a fast validation workflow.
- **FR-027**: Gate validation MUST surface VALID, INVALID, ALREADY USED, and WRONG EVENT outcomes with unmistakable status, and camera failure MUST preserve manual fallback.
- **FR-028**: Logout MUST be available in each authenticated experience and MUST clear the current session according to the existing token architecture.
- **FR-029**: The frontend MUST map only to verified backend routes and MUST not present any unverified route as an existing product capability.
- **FR-030**: The frontend MUST preserve current backend authorization and business rules; hiding a control in the UI MUST never be treated as authorization.
- **FR-031**: All critical flows MUST provide loading, empty, error, success, conflict, declined, invalid, already-used, and wrong-event states where applicable.
- **FR-032**: Visual references from `docs/design/` MUST inform the UI direction, but application behavior MUST continue to follow verified backend data and rules.

### Design-to-Flow Mapping

- **Public discovery**: `docs/design/01_home/`, `docs/design/02_event_detail/`
- **Login and registration**: `docs/design/01_home/`, plus login and registration layouts aligned to the same public shell
- **Reserved or quantity purchase**: `docs/design/03_checkout/`, `docs/design/04_payment_approved/`, `docs/design/05_payment_declined/`
- **My Tickets and Ticket Detail**: `docs/design/06_my_tickets/`, `docs/design/07_ticket_detail/`
- **Shared Ticket**: `docs/design/08_shared_ticket/`
- **Organizer Events and Create Event**: `docs/design/09_organizer_events/`, `docs/design/10_create_event/`
- **Gate Scanner and validation results**: `docs/design/11_gate_scanner/`, `docs/design/12_valid/`, `docs/design/13_invalid/`, `docs/design/14_already_used/`, `docs/design/15_wrong_event/`

### Frontend-Route / API Matrix

#### Public

- **Home** -> `GET /api/v1/events`
- **Login** -> `POST /api/v1/auth/token`
- **Register** -> backend registration contract to verify
- **Event Detail** -> `GET /api/v1/events/{eventId}`
- **Shared Ticket** -> `GET /api/v1/shared/tickets/{shareToken}`

#### Customer protected

- **Reservation** -> `POST /api/v1/events/{eventId}/reservations`
- **Payment** -> `POST /api/v1/reservations/{reservationId}/payment`
- **My Tickets** -> `GET /api/v1/me/tickets`
- **Share** -> `POST /api/v1/me/tickets/{ticketId}/share`

#### Organizer protected

- **Organizer Events** -> `GET /api/v1/organizer/events`
- **Catalog Search** -> `GET /api/v1/catalog/events`
- **Catalog Detail** -> `GET /api/v1/catalog/events/{external_id}`
- **Create Event** -> `POST /api/v1/events`
- **Publish** -> `POST /api/v1/events/{eventId}/publish`
- **Cancel** -> `POST /api/v1/events/{eventId}/cancel`

#### Gate protected

- **Gate Events** -> `GET /api/v1/gate/events`
- **Validate** -> `POST /api/v1/gate/events/{eventId}/validate`

#### Operational

- **Live health** -> `GET /health/live`
- **Ready health** -> `GET /health/ready`

## Backend Dependency and Gap Section

- **Customer registration is unresolved**: the supplied backend inventory and verified router set do not expose a registration endpoint. The frontend must present a visible "Criar conta" option, but production registration must not be faked until a verified backend contract exists.
- **Seat map and sector data are unresolved**: the verified backend exposes only quantity reservation directly. If seat or sector allocation data is available inside `GET /api/v1/events/{eventId}` or the reservation schema, the frontend may surface it; otherwise the production UI must use the supported quantity-based flow and must not fabricate live availability.
- **Role/session detail is verified only through token login**: `POST /api/v1/auth/token` returns access token, expiry, and role. No `/me` profile endpoint is required for this spec.
- **Gate validation and checkout depend on idempotency headers**: the backend validates payment and gate actions using an `Idempotency-Key` header on the relevant endpoints.
- **Catalog search requires organizer authorization**: the catalog routes are protected and must remain organizer-only.

## Assumptions

- The frontend will reuse the existing backend JWT model and role claim rather than introducing a second authentication system.
- The current application navigation can evolve while preserving the supported route conventions already in use.
- Public discovery should be usable without sign-in, but ticket purchase and management require Customer authentication.
- Organizer and Gate experiences may prioritize desktop readability, while Customer flows must remain mobile-first.
- Visual references in `docs/design/` are approved for direction, but only real backend data and verified state may drive the rendered experience.
- No real payment processor is introduced; payment remains simulated according to the backend contract.
- `docs/product/PRD.md` corresponds to the repository `PRD.md` file and is treated as the product source of truth.

## Responsive Requirements

- The Customer experience MUST work cleanly on small touch screens first, with no required horizontal scrolling for primary actions.
- The Organizer experience MAY optimize for wider screens, but it MUST remain usable on smaller viewports.
- The Gate experience MUST prioritize contrast, speed, large controls, and minimal distraction on both mobile and desktop.
- Mobile and desktop variants MUST be treated as one responsive product flow, not separate business implementations.

## Accessibility Requirements

- All interactive controls MUST have explicit names, visible focus, and keyboard access.
- Form fields MUST have labels and associated error messages.
- Status information MUST not rely on color alone.
- Gate validation results MUST communicate status with text and structure, not color only.
- Ticket selection, checkout, registration, and login MUST remain usable with keyboard-only input.
- Motion MUST be restrained and MUST respect reduced-motion preferences.

## Non-Functional Requirements

- The experience MUST remain understandable during loading, empty, error, conflict, declined, and invalid states.
- The interface MUST avoid generic dashboard styling and instead follow the approved editorial ticketing direction.
- The product MUST prioritize clear recovery actions over decorative interaction.
- Critical business decisions MUST remain backend authoritative even when the UI uses simplified or hidden controls.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of test users can discover an event, open its detail page, and begin purchase without assistance on the first attempt.
- **SC-002**: At least 90% of test users can sign in as Customer, Organizer, or Gate Staff and land on the correct role experience within 30 seconds.
- **SC-003**: In acceptance tests, a Customer can complete reservation, approved payment, and ticket access without a broken handoff in 100% of seeded happy-path runs.
- **SC-004**: In acceptance tests, a declined payment preserves the reservation outcome and presents a recoverable next step in 100% of seeded decline runs.
- **SC-005**: In acceptance tests, My Tickets, ticket detail, shared ticket, organizer events, organizer create/publish/cancel, and gate validation all render with the correct verified backend data and expected states.
- **SC-006**: In validation tests, no critical flow relies on invented seat, sector, registration, or authorization behavior that is not supported by the backend contract.
- **SC-007**: In accessibility checks, keyboard-only users can complete the main Customer, Organizer, and Gate journeys on mobile and desktop layouts.
- **SC-008**: In responsive checks, the main flows remain readable and actionable without primary-content horizontal overflow on supported viewports.

## Out of Scope

- Rewriting the Python backend.
- Inventing registration, seat-map, or sector-availability APIs.
- Introducing real payment processing.
- Adding password recovery, social login, ticket resale, or fiscal invoice features.
- Implementing frontend-only authorization.
- Changing backend business rules to match a visual reference.
- Modifying approved files under `docs/design/` during implementation without a separate design-update task.

