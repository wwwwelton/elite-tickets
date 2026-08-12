# Catalog API Contract

## Overview

EliteTickets exposes a normalized catalog contract backed by Ticketmaster Discovery API V2.
The frontend consumes only these EliteTickets endpoints.

## Endpoints

### `GET /api/v1/catalog/events`

Query params:

- `keyword` required for search
- `page` optional, default `1`
- `size` optional, bounded by backend policy
- `countryCode` optional, default `BR`
- `city` optional when applicable

Response:

```json
{
  "items": [
    {
      "external_id": "G5diZf...",
      "title": "Show Example",
      "description": "Optional short summary",
      "image_url": "https://...",
      "category": "Music",
      "date": "2026-11-20",
      "venue_name": "Venue Example",
      "city": "São Paulo",
      "country_code": "BR",
      "source": "ticketmaster"
    }
  ],
  "page": 1,
  "size": 20,
  "total": 123,
  "has_more": true
}
```

### `GET /api/v1/catalog/events/{external_id}`

Response:

```json
{
  "external_id": "G5diZf...",
  "title": "Show Example",
  "description": "Optional short summary",
  "image_url": "https://...",
  "category": "Music",
  "date": "2026-11-20",
  "venue_name": "Venue Example",
  "city": "São Paulo",
  "country_code": "BR",
  "source": "ticketmaster"
}
```

## Mapping rules

- Ticketmaster `apikey` is injected only in the backend.
- Upstream payloads are normalized before returning to the frontend.
- Optional fields may be omitted or `null`.
- No raw Ticketmaster response is returned to the browser.
- Default `countryCode` is `BR`.

## Pagination rules

- `page` is 1-based.
- `size` is bounded server-side.
- Empty result sets return `items: []` with a successful response.
- Search term validation happens before the upstream call.

## Detail behavior

- Detail requests use the same normalized DTO shape as search results, with any additional fields filled from the upstream detail endpoint when available.
- If the upstream item is unavailable after creation, the persisted event snapshot remains the source of truth for already-created EliteTickets events.
