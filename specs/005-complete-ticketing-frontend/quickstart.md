# Quickstart: Complete Ticketing Frontend

## Prerequisites

- Repository checked out locally.
- Backend dependencies available for the existing Elite Tickets API.
- Frontend app available under `apps/web/` for implementation.

## Validation Scenarios

### 1. Public discovery

1. Start the backend and frontend.
2. Open the home page.
3. Confirm published events appear in nearest-upcoming order.
4. Confirm search updates results without inventing unsupported filters.

Expected outcome: The visitor can browse events, search, and open event detail pages with responsive loading, empty, and error states.

### 2. Authentication and role routing

1. Open the login page.
2. Sign in as a Customer, Organizer, and Gate user in separate runs.
3. Confirm each role lands in the correct experience.
4. Verify logout returns to the public shell.

Expected outcome: The backend role claim determines the visible experience and session state.

### 3. Customer purchase flow

1. Open an event detail page as a signed-in Customer.
2. Create a reservation using the backend-supported selection mode.
3. Review the order and submit simulated payment with the approved token.
4. Repeat with the declined token.

Expected outcome: Approved payment leads to ticket access; declined payment preserves reservation semantics and shows recovery.

### 4. Tickets, QR, and sharing

1. Open My Tickets.
2. Open a ticket detail page.
3. Share the ticket and open the generated public link.

Expected outcome: The customer sees secure ticket data, a share link, and a public read-only shared ticket view.

### 5. Organizer management

1. Sign in as an Organizer.
2. Open organizer events.
3. Search the external catalog, create an event, publish it, and cancel it in separate runs.

Expected outcome: The organizer can manage owned events using only verified backend fields and actions.

### 6. Gate validation

1. Sign in as Gate Staff.
2. Select a gate-eligible event.
3. Validate a ticket and verify each result state.
4. Confirm manual entry remains available if camera access is unavailable.

Expected outcome: Gate validation clearly distinguishes valid, invalid, already-used, and wrong-event outcomes.

## Reference Links

- Data model: [`data-model.md`](./data-model.md)
- API surface: [`contracts/openapi.md`](./contracts/openapi.md)
- Feature behavior: [`spec.md`](./spec.md)

