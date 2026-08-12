# UI View-Model and State Inventory

This feature adds no persistent entities, migrations, backend endpoints, or API
contracts. Existing data remains authoritative.

| View model | Flows | Dynamic values |
|---|---|---|
| Public event/detail | Home, event detail, checkout | id, title, artwork, schedule, venue, synopsis, availability, price |
| Catalog result/detail | Organizer create | external id, title, image/category, provenance |
| Reservation/payment | Checkout states | quantity, expiry, approved/declined/expired outcome |
| Customer ticket/share | My Tickets, detail, shared ticket | event, owner, status, issued time, secure QR/share state |
| Auth session | Login/protected routes | JWT, expiry, role |
| Organizer event | Organizer list | status, capacity, sold/available, operational values |
| Gate validation | Scanner/result states | `VALID`, `INVALID`, `ALREADY_USED`, `WRONG_EVENT`, attempted time |

## State rules

- Loading and empty states are distinct from network/API and authorization errors.
- Validation, payment, expiry, and Gate outcome text remains understandable without
  color alone.
- Camera failure preserves manual credential entry.
- Secure QR/share credentials remain generated and interpreted by existing backend
  behavior; predictable IDs are never substituted.
