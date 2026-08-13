# Verified Frontend API Contract Surface

This feature uses the existing backend API surface below. No unverified route is introduced by this plan.

## Public

- `GET /api/v1/events`
- `GET /api/v1/events/{eventId}`
- `GET /api/v1/shared/tickets/{shareToken}`
- `POST /api/v1/auth/token`

## Customer protected

- `POST /api/v1/events/{eventId}/reservations`
- `POST /api/v1/reservations/{reservationId}/payment`
- `GET /api/v1/me/tickets`
- `POST /api/v1/me/tickets/{ticketId}/share`

## Organizer protected

- `GET /api/v1/organizer/events`
- `GET /api/v1/catalog/events`
- `GET /api/v1/catalog/events/{external_id}`
- `POST /api/v1/events`
- `POST /api/v1/events/{eventId}/publish`
- `POST /api/v1/events/{eventId}/cancel`

## Gate protected

- `GET /api/v1/gate/events`
- `POST /api/v1/gate/events/{eventId}/validate`

## Operational

- `GET /health/live`
- `GET /health/ready`

## Verified request and response notes

- Login returns access token, expiry, and role.
- Reservations accept quantity only and return a reservation summary.
- Payment requires an `Idempotency-Key` header and returns approved or declined result data.
- My Tickets returns the authenticated customer's tickets.
- Sharing returns a public share URL.
- Gate validation requires an `Idempotency-Key` header and returns a validation result plus timestamp.
- Public event listing supports `query` and `page`.
- Organizer catalog search supports `keyword`, `page`, `size`, `countryCode`, and optional `city`.
- Organizer event creation supports catalog-backed event creation with venue, schedule, capacity, and price fields.

