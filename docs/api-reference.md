# Elite Tickets API Reference

This document summarizes the verified backend API for the Elite Tickets frontend.
It is written for frontend and integration work: which route to call, what to send,
and what to expect back.

Base path for application routes:

`/api/v1`

Operational health routes live outside that prefix:

- `GET /health/live`
- `GET /health/ready`

## Authentication

### POST `/api/v1/auth/token`

Login with email and password.

Request body:

```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "access_token": "jwt-access-token",
  "token_type": "bearer",
  "expires_in": 3600,
  "role": "CUSTOMER"
}
```

Notes:

- `role` is authoritative and comes from the backend.
- Use the returned bearer token in the `Authorization: Bearer <token>` header for protected routes.

### POST `/api/v1/auth/register`

Registers a new account and returns a bearer token, exactly like `/api/v1/auth/token`.

Request body:

```json
{
  "email": "customer@example.com",
  "password": "password123",
  "display_name": "Jane Customer",
  "role": "CUSTOMER"
}
```

Accepted `role` values:

- `CUSTOMER`
- `ORGANIZER`
- `GATE`

Response `201 Created`:

```json
{
  "access_token": "jwt-access-token",
  "token_type": "bearer",
  "expires_in": 900,
  "role": "CUSTOMER"
}
```

Possible error cases:

- `409` email is already registered
- `422` invalid email, password shorter than 8 characters, blank display name, or unrecognized role

Notes:

- `email` is normalized (trimmed and lowercased) before the uniqueness check and storage.
- The account is active immediately; no separate verification step is required.
- Use the returned token exactly as with `/api/v1/auth/token` — no separate login call is needed after registering.

## Public Events

### GET `/api/v1/events`

Returns a paginated list of published public events.

Query parameters:

- `query` optional search text
- `page` optional page number, default `1`

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Movie Night",
      "starts_at": "2026-08-20T19:30:00Z",
      "venue_name": "Elite Cinema",
      "price": "45.00",
      "poster_url": "https://...",
      "overview": "..."
    }
  ],
  "page": 1,
  "size": 20,
  "total": 1,
  "has_more": false
}
```

Frontend usage:

- Use `items` for the visible event list.
- Preserve nearest-upcoming ordering for the shown result set.
- Treat `query` as the supported public search/filter input.

### GET `/api/v1/events/{eventId}`

Returns one published event.

Response:

```json
{
  "id": "uuid",
  "title": "Movie Night",
  "starts_at": "2026-08-20T19:30:00Z",
  "venue_name": "Elite Cinema",
  "price": "45.00",
  "poster_url": "https://...",
  "overview": "..."
}
```

Frontend usage:

- This is the event detail source.
- If the event is not public or does not exist, the backend returns a not-found response.

## Reservations and Payment

### POST `/api/v1/events/{eventId}/reservations`

Create a reservation for a published event.

Authorization:

- `CUSTOMER` role required

Request body:

```json
{
  "quantity": 2
}
```

Response `201 Created`:

```json
{
  "id": "uuid",
  "event_id": "uuid",
  "status": "PENDING",
  "quantity": 2,
  "total_amount": "90.00",
  "expires_at": "2026-08-13T15:45:00Z"
}
```

Possible error cases:

- `403` customer role missing
- `409` event state or inventory conflict

Frontend usage:

- Send the selected quantity only.
- Do not fabricate seat or sector availability.

### POST `/api/v1/reservations/{reservationId}/payment`

Submit the simulated payment decision for a reservation.

Authorization:

- `CUSTOMER` role required
- `Idempotency-Key` header required

Request body:

```json
{
  "payment_token": "tok_approved"
}
```

Accepted values:

- `tok_approved`
- `tok_declined`

Response `200 OK`:

```json
{
  "reservation": {
    "id": "uuid",
    "event_id": "uuid",
    "status": "PAID",
    "quantity": 2,
    "total_amount": "90.00",
    "expires_at": "2026-08-13T15:45:00Z"
  },
  "decision": "APPROVED",
  "tickets": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "owner_name": "Customer Name",
      "status": "ACTIVE",
      "issued_at": "2026-08-13T15:46:00Z",
      "used_at": null,
      "qr_credential": "signed-ticket-credential"
    }
  ]
}
```

Possible error cases:

- `403` reservation ownership or role is insufficient
- `409` reservation state or idempotency conflict

Frontend usage:

- Use the returned `decision` to render approved or declined states.
- Use the returned `tickets` list to drive ticket detail screens.

## My Tickets

### GET `/api/v1/me/tickets`

Returns the authenticated customer’s tickets.

Authorization:

- `CUSTOMER` role required

Response:

```json
[
  {
    "id": "uuid",
    "event_id": "uuid",
    "owner_name": "Customer Name",
    "status": "ACTIVE",
    "issued_at": "2026-08-13T15:46:00Z",
    "used_at": null,
    "qr_credential": "signed-ticket-credential"
  }
]
```

Frontend usage:

- This is the source for the My Tickets screen.
- The backend already orders tickets newest first.
- Response is marked `no-store`.

## Ticket Sharing

### POST `/api/v1/me/tickets/{ticketId}/share`

Creates a share link for a ticket.

Authorization:

- `CUSTOMER` role required

Request body:

```json
{}
```

Response:

```json
{
  "share_url": "https://app.example.com/shared/tickets/share-token"
}
```

### GET `/api/v1/shared/tickets/{shareToken}`

Returns the shared ticket view for a valid share token.

Response:

```json
{
  "id": "uuid",
  "event_id": "uuid",
  "event_title": "Movie Night",
  "owner_name": "Customer Name",
  "status": "ACTIVE",
  "issued_at": "2026-08-13T15:46:00Z",
  "used_at": null,
  "qr_credential": "signed-ticket-credential"
}
```

Frontend usage:

- Keep the shared view minimal.
- Do not show private account data.

## Organizer

### POST `/api/v1/events`

Creates an organizer event from a selected external catalog item.

Authorization:

- `ORGANIZER` role required

Request body:

```json
{
  "external_id": "tmdb-or-ticketmaster-id",
  "venue_name": "Elite Arena",
  "venue_address": "Main St 123",
  "starts_at": "2026-08-20T19:30:00Z",
  "ends_at": "2026-08-20T22:00:00Z",
  "timezone": "America/Sao_Paulo",
  "capacity": 500,
  "price": "45.00"
}
```

Response:

```json
{
  "id": "uuid",
  "state": "DRAFT",
  "title": "Movie Night",
  "poster_url": "https://...",
  "starts_at": "2026-08-20T19:30:00Z",
  "ends_at": "2026-08-20T22:00:00Z",
  "timezone": "America/Sao_Paulo",
  "venue_name": "Elite Arena",
  "venue_address": "Main St 123",
  "capacity": 500,
  "reserved_quantity": 0,
  "sold_quantity": 0,
  "available_quantity": 500,
  "price": "45.00"
}
```

### GET `/api/v1/organizer/events`

Lists events owned by the authenticated organizer.

Authorization:

- `ORGANIZER` role required

Response:

```json
[
  {
    "id": "uuid",
    "state": "DRAFT",
    "title": "Movie Night",
    "poster_url": "https://...",
    "starts_at": "2026-08-20T19:30:00Z",
    "ends_at": "2026-08-20T22:00:00Z",
    "timezone": "America/Sao_Paulo",
    "venue_name": "Elite Arena",
    "venue_address": "Main St 123",
    "capacity": 500,
    "reserved_quantity": 0,
    "sold_quantity": 0,
    "available_quantity": 500,
    "price": "45.00"
  }
]
```

### POST `/api/v1/events/{eventId}/publish`

Publishes an organizer event.

Authorization:

- `ORGANIZER` role required

Response:

- Returns the updated organizer event

### POST `/api/v1/events/{eventId}/cancel`

Cancels an organizer event.

Authorization:

- `ORGANIZER` role required

Response:

- Returns the updated organizer event

## Catalog

### GET `/api/v1/catalog/events`

Searches the external catalog.

Query parameters:

- `keyword` required for useful search

Response:

```json
{
  "items": [
    {
      "external_id": "catalog-id",
      "title": "Movie Title",
      "description": "...",
      "image_url": "https://...",
      "external_url": "https://...",
      "category": "movie",
      "date": "2026-08-20",
      "venue_name": "Cinema City",
      "city": "Sao Paulo",
      "country_code": "BR",
      "source": "ticketmaster"
    }
  ],
  "page": 1,
  "size": 20,
  "total": 1,
  "has_more": false
}
```

### GET `/api/v1/catalog/events/{external_id}`

Returns one catalog item by external id.

Response:

```json
{
  "external_id": "catalog-id",
  "title": "Movie Title",
  "description": "...",
  "image_url": "https://...",
  "external_url": "https://...",
  "category": "movie",
  "date": "2026-08-20",
  "venue_name": "Cinema City",
  "city": "Sao Paulo",
  "country_code": "BR",
  "source": "ticketmaster"
}
```

## Gate

### GET `/api/v1/gate/events`

Lists published events available for gate validation.

Authorization:

- `GATE` role required

Response:

```json
[
  {
    "id": "uuid",
    "title": "Movie Night",
    "starts_at": "2026-08-20T19:30:00Z",
    "venue_name": "Elite Arena",
    "price": "45.00",
    "poster_url": "https://...",
    "overview": "..."
  }
]
```

### POST `/api/v1/gate/events/{eventId}/validate`

Validates a ticket credential against the selected event.

Authorization:

- `GATE` role required
- `Idempotency-Key` header required

Request body:

```json
{
  "credential": "signed-ticket-credential"
}
```

Response:

```json
{
  "result": "VALID",
  "attempted_at": "2026-08-13T15:50:00Z"
}
```

Possible `result` values:

- `VALID`
- `INVALID`
- `ALREADY_USED`
- `WRONG_EVENT`

## Health

### GET `/health/live`

Operational liveness probe.

### GET `/health/ready`

Operational readiness probe.

## Frontend Usage Guide

### Authentication flow

1. Call `POST /api/v1/auth/token` with email and password, or `POST /api/v1/auth/register` to create an account and sign in in one step.
2. Store the returned bearer token.
3. Route by `role`:
   - `CUSTOMER` to customer home / event discovery
   - `ORGANIZER` to organizer events
   - `GATE` to gate event selection / scanner

### Purchase flow

1. Load the event detail with `GET /api/v1/events/{eventId}`.
2. Create the reservation with `POST /api/v1/events/{eventId}/reservations`.
3. Review the order.
4. Submit simulated payment with `POST /api/v1/reservations/{reservationId}/payment`.
5. If approved, show tickets from the response payload.
6. If declined, keep the reservation state visible and offer retry or back navigation.

### Ticket sharing flow

1. Open ticket detail from `GET /api/v1/me/tickets`.
2. Call `POST /api/v1/me/tickets/{ticketId}/share`.
3. Redirect the user to the returned share URL.
4. Public viewers open `GET /api/v1/shared/tickets/{shareToken}`.

### Gate validation flow

1. Authenticate as `GATE`.
2. Load `GET /api/v1/gate/events`.
3. Select the event being scanned.
4. Submit the ticket credential to `POST /api/v1/gate/events/{eventId}/validate`.
5. Render the returned result state.


