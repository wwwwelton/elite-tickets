# Frontend inventory — 002 Ticketmaster + visual redesign

## Current app routes

### Public

- `apps/web/app/(public)/page.tsx`
- `apps/web/app/(public)/events/[eventId]/page.tsx`

### Customer

- `apps/web/app/customer/checkout/[eventId]/page.tsx`
- `apps/web/app/customer/tickets/page.tsx`
- `apps/web/app/customer/tickets/[ticketId]/page.tsx`

### Shared ticket

- `apps/web/app/shared/tickets/[shareToken]/page.tsx`

### Organizer

- `apps/web/app/organizer/events/page.tsx`
- `apps/web/app/organizer/events/new/page.tsx`

### Gate

- `apps/web/app/gate/page.tsx`

### Shell / auth

- `apps/web/app/layout.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/login/page.tsx`

## Current shared components

### UI primitives

- `apps/web/components/ui/button.tsx`
- `apps/web/components/ui/ledger.tsx`
- `apps/web/components/ui/perforation.tsx`
- `apps/web/components/ui/status.tsx`
- `apps/web/components/ui/ticket.tsx`

### Events

- `apps/web/components/events/event-card.tsx`
- `apps/web/components/events/event-form.tsx`
- `apps/web/components/events/event-list.tsx`
- `apps/web/components/events/organizer-ledger.tsx`
- `apps/web/components/events/poster.tsx`
- `apps/web/components/events/quantity-control.tsx`
- `apps/web/components/events/types.ts`

### Tickets

- `apps/web/components/tickets/my-tickets.tsx`
- `apps/web/components/tickets/scanner.tsx`
- `apps/web/components/tickets/share-action.tsx`
- `apps/web/components/tickets/ticket.tsx`
- `apps/web/components/tickets/validation-result.tsx`

### Checkout

- `apps/web/components/checkout/checkout-flow.tsx`
- `apps/web/components/checkout/countdown.tsx`

### Auth

- `apps/web/components/auth/login-form.tsx`
