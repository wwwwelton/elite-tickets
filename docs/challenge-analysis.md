# Challenge Analysis

## Product

EliteTickets is a platform where organizers publish events and customers buy tickets.

## Main actors

### Organizer
Creates and manages events.

### Customer
Browses events, reserves tickets, performs simulated payment and receives tickets.

### Gate
Validates tickets during event entrance.

## MVP decision

The MVP uses quantity-based ticket sales instead of seat maps.

Reason:
The challenge explicitly allows either model. Quantity-based inventory reduces UI complexity and allows the project to prioritize the complete reservation → payment → ticket → validation lifecycle.

## External catalog

TMDb will be used as the external catalog.

## Important technical risks

1. Overselling inventory.
2. Double ticket validation.
3. Forged QR codes.
4. Authorization between roles.
5. Payment rejection consistency.
6. External API availability.

## Explicitly out of scope for MVP

- seat maps
- native mobile app
- password recovery
- invoice generation
- ticket resale
- real payment processing
- email delivery
