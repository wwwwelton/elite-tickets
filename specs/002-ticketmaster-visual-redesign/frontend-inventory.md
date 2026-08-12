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

## Visual direction extracted from approved design artifacts

### From `DESIGN.md`

- Editorial brutalist aesthetic: high-contrast, ticket-like, poster-like, strongly structured.
- Black canvas with white text and a single cinema-red accent.
- No rounded corners, no shadows, no glassmorphism, no generic SaaS styling.
- Ticket components should use perforation/dashed dividers and visible structural borders.
- Typography hierarchy:
  - Bodoni Moda for display and headings.
  - Inter for body and functional labels.
  - JetBrains Mono for data, codes, prices, and ticket metadata.
- Statuses must be explicit, not color-only.
- Customer experience is mobile-first.
- Gate must prioritize speed and legibility.
- Organizer may be desktop-oriented but still responsive.

### From `docs/design/stitch-prompts.md`

- Design targets:
  - Home
  - Event Detail
  - Checkout
  - Payment Approved
  - Payment Declined
  - My Tickets
  - Ticket Detail
  - Shared Ticket
  - Organizer Events
  - Create Event
  - Gate Scanner
  - Valid
  - Invalid
  - Already Used
  - Wrong Event
- Reused motifs:
  - physical tickets
  - cinema admission tickets
  - event posters
  - editorial typography
- Explicit exclusions:
  - no generic dashboard SaaS look
  - no excessive gradients
  - no glassmorphism
  - no heavy statistic-card layouts

### HTML references

- Use `docs/design/*.html` files as approved structure and composition references when they are present in the repository snapshot. None are present in this snapshot.

## Implementation implications

- Preserve the current app routes and rebuild them with reusable ticket/editorial primitives.
- Keep the strong black/white/red palette and the monospace data treatment.
- Treat ticket cards, ledgers, perforation dividers, and status stamps as core shared building blocks.
- Avoid introducing a second visual language in any new page or selector UI.
