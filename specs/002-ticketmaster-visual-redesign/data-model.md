# Data Model: Catálogo Ticketmaster e evolução visual

## Entities

### CatalogSearchResult

- `external_id`: Ticketmaster event id
- `title`: canonical display title
- `description`: optional short description or summary
- `image_url`: optional image for list/detail presentation
- `category`: optional category or genre label
- `date`: optional event date when available
- `venue_name`: optional venue label when available
- `city`: optional city when available
- `country_code`: normalized country code used for filtering and display context
- `source`: fixed value `ticketmaster`

Rules:

- Search results are transient and must not be treated as persisted business entities.
- Optional fields may be absent without causing validation failure.
- The backend may normalize one upstream event into one internal DTO even when upstream exposes nested structures.

### CatalogEventDetail

- `external_id`
- `title`
- `description`
- `image_url`
- `category`
- `date`
- `venue_name`
- `city`
- `country_code`
- `source`

Rules:

- Detail payload is the normalized representation returned by EliteTickets.
- It must not expose upstream credentials or raw upstream response metadata.

### EventExternalSnapshot

- `external_source`: fixed value `ticketmaster`
- `external_id`: upstream event identifier
- `external_url`: optional canonical upstream link when available
- `title`
- `description`
- `image_url`
- `category`
- `date`
- `venue_name`
- `city`
- `country_code`
- `snapshot_at`

Rules:

- The snapshot is persisted with the EliteTickets event at creation time.
- The snapshot is immutable once stored.
- Missing optional upstream fields are allowed; the snapshot stores only what exists.
- Operational fields remain separate from this snapshot.

### EliteTicketsEvent

Existing entity, with the following relevant fields preserved:

- `starts_at`
- `venue`
- `capacity`
- `available_quantity`
- `price_cents`
- `sold_quantity`

Relationships:

- Belongs to one organizer.
- Has one persisted external snapshot.
- Continues to serve customer, organizer, and gate flows independently of the upstream catalog.

Rules:

- Operational fields remain organizer-owned.
- External snapshot never replaces the event's operational data.
- The event must remain renderable even if Ticketmaster is unavailable later.

## State and failure mapping

- `loading`: active remote search in progress.
- `empty`: upstream search returned no results.
- `auth_error`: missing/invalid upstream credentials or upstream auth rejection.
- `rate_limited`: upstream 429.
- `upstream_error`: timeout or 5xx failure.

These states are surfaced by the backend contract and rendered distinctly by the frontend.
