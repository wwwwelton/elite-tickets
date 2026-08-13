# Data Model: Complete Ticketing Frontend

## Event

- **Purpose**: Public and organizer-managed event shown in discovery, detail, organizer lists, and gate selection.
- **Key fields**: `id`, `title`, `starts_at`, `ends_at`, `timezone`, `venue_name`, `venue_address`, `price`, `currency`, `state`, `available_quantity`, `reserved_quantity`, `sold_quantity`, `published_at`, `cancelled_at`.
- **Relationships**: May include a single movie snapshot; belongs to one organizer; can have many reservations and tickets.
- **Validation rules**: Upcoming published events appear first in discovery; event inventory cannot exceed capacity or become negative; published visibility is controlled by backend state.

## Movie Snapshot

- **Purpose**: Preserved external catalog details used to recognize or describe an event.
- **Key fields**: `external_source`, `external_id`, `external_url`, `tmdb_id`, `title`, `overview`, `poster_path`, `image_url`, `backdrop_path`, `release_date`, `event_date`, `category`, `venue_name`, `city`, `country_code`, `genres`, `snapshot_at`.
- **Relationships**: One-to-one with an event.
- **Validation rules**: Snapshot data is read-only from the frontend perspective and must not override commercial event data.

## User

- **Purpose**: Authenticated platform actor.
- **Key fields**: `id`, `email`, `display_name`, `role`, `is_active`.
- **Relationships**: Can own organizer events; can own customer reservations and tickets; can validate as gate staff.
- **Validation rules**: Role determines permitted experience; inactive users must not be treated as authenticated.

## Reservation

- **Purpose**: Customer ticket hold created before payment completion.
- **Key fields**: `id`, `event_id`, `customer_id`, `status`, `quantity`, `unit_price`, `total_amount`, `currency`, `expires_at`, `completed_at`.
- **Relationships**: Belongs to one event and one customer; may have one simulated payment; may lead to one or more tickets.
- **Validation rules**: Quantity must be positive; total must equal quantity times unit price; expiration must be after creation; terminal states require completion time.
- **State transitions**: `PENDING` -> `APPROVED`, `DECLINED`, `EXPIRED`, or `CANCELLED`.

## Simulated Payment

- **Purpose**: Recorded result of the checkout simulation.
- **Key fields**: `id`, `reservation_id`, `idempotency_key`, `test_token`, `decision`, `processed_at`.
- **Relationships**: One-to-one with a reservation.
- **Validation rules**: Decision must match the token; the same reservation cannot be paid twice; repeated requests must respect idempotency.

## Ticket

- **Purpose**: Issued admission credential for a paid reservation.
- **Key fields**: `id`, `reservation_id`, `event_id`, `owner_id`, `ordinal`, `qr_credential`, `qr_nonce_hash`, `qr_key_id`, `status`, `issued_at`, `used_at`, `used_by_id`.
- **Relationships**: Belongs to one reservation, one event, and one owner; may be used by one gate user.
- **Validation rules**: QR credential must be non-guessable; a ticket cannot be used twice; `used_at` and `used_by_id` must change together.
- **State transitions**: `ACTIVE` -> `USED` or `CANCELLED`.

## Share Link

- **Purpose**: Public, read-only access token for a ticket view.
- **Key fields**: `token`, `ticket_id`, `created_at`, `expires_at` when applicable.
- **Relationships**: Points to one ticket and one owner.
- **Validation rules**: Share token must not reveal private account data and may expire or become unavailable per backend behavior.

## Gate Validation Result

- **Purpose**: Backend-authoritative outcome of entry validation.
- **Key fields**: `result`, `attempted_at`.
- **Relationships**: Associated with a selected gate event and a presented credential.
- **Validation rules**: Must surface `VALID`, `INVALID`, `ALREADY_USED`, or `WRONG_EVENT` as distinct outcomes.

## Frontend Session

- **Purpose**: Browser-held authenticated state used to render the correct role experience.
- **Key fields**: `access_token`, `expires_in`, `role`.
- **Relationships**: Derived from login response; governs navigation and protected experiences.
- **Validation rules**: The backend token response is authoritative; the UI must not infer permissions beyond the returned role.

