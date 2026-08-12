# Research: Frontend Design Refactor

## Decision: preserve the current Next.js App Router frontend

- **Evidence**: `apps/web/package.json` and `apps/web/app/` show Next.js 15.5
  App Router with React 19, not a separate SPA router or alternate framework.
- **Rationale**: the feature is a navigation and auth-shell refactor, so the
  lowest-risk path is to keep the existing route structure and shared components.
- **Alternatives rejected**: moving to Vite, React Router, or a different design
  system would add migration work unrelated to the approved product behavior.

## Decision: retain npm, Next.js App Router, and React

- **Evidence**: `apps/web/package.json` uses npm, Next.js 15.5.23, React 19.2.8,
  `next dev/build`, and route files under `apps/web/app/`.
- **Rationale**: the requested work is a visual refactor; changing framework or
  package manager would add unrelated migration risk.
- **Alternatives rejected**: Vite, React Router, Tailwind, CSS Modules, Bootstrap,
  and a component library are not present and are unnecessary.

## Decision: preserve API and authentication boundaries

- **Evidence**: `apps/web/lib/api.ts` owns URL/error normalization and
  `apps/web/lib/auth.ts` owns JWT session storage and role guards.
- **Rationale**: FR-015 requires presentation-only consumption; no contract,
  session, authorization, or backend decision changes are allowed.
- **Alternatives rejected**: introducing a new API client, cache, auth provider, or
  state library would expand scope and risk.

## Decision: eight responsive pairs, 15 flows

- **Evidence**: 23 design directories contain eight mobile/desktop pairs plus
  seven standalone states/flows.
- **Rationale**: each pair is one responsive product feature; payment and Gate
  result references are states of existing routes.
- **Alternatives rejected**: treating mobile and desktop as separate pages would
  duplicate business behavior and violate FR-011/FR-016.

## Decision: existing CSS tokens and primitives

- **Evidence**: `apps/web/app/globals.css` and `apps/web/components/ui/` already
  provide tokens, layout rules, Button, Ticket, Status, LedgerRow, and perforation.
- **Rationale**: extending these preserves the approved editorial identity and
  avoids new dependencies.
- **Alternatives rejected**: a new design system or CSS framework is not justified.

## Decision: validation uses existing tools plus a documented visual matrix

- **Evidence**: Vitest, Testing Library, Playwright, ESLint, TypeScript, and Next
  build are already configured; no visual comparison service exists.
- **Rationale**: existing tools cover behavior/accessibility, while a manual or
  browser-assisted matrix can record the SC-001 blocking criteria without adding
  heavy infrastructure.
- **Alternatives rejected**: Percy/Chromatic or a new screenshot service would add
  cost and snapshot maintenance without a requirement.

## Decision: use public navigation patterns for information architecture only

- **Evidence**: Sympla, Eventim, and Ingresso.com all make account access and
  ticket lookup easy to find, and at least one supports a unified login journey
  for buyer/producer-style access.
- **Rationale**: the feature needs clear visitor/login, purchased-ticket access,
  organizer entry, and responsive wayfinding, but the final visual treatment must
  remain original and follow the approved Stitch direction.
- **Alternatives rejected**: copying benchmark CSS/branding or forcing a branded
  hero/dashboard pattern would conflict with the approved visual language.

## Reference inventory

All 23 design directories are mapped to the existing application: `01_home` and
`01_home_desktop` to `/`; `02_event_detail` pair to `/events/[eventId]`;
`03_checkout` pair to `/customer/checkout/[eventId]`; `04_payment_approved` and
`05_payment_declined` to checkout result states; `06_my_tickets` pair to
`/customer/tickets`; `07_ticket_detail` pair to `/customer/tickets/[ticketId]`;
`08_shared_ticket` to `/shared/tickets/[shareToken]`; `09_organizer_events` pair
to `/organizer/events`; `10_create_event` pair to `/organizer/events/new`;
`11_gate_scanner` pair to `/gate`; and `12_valid`, `13_invalid`,
`14_already_used`, `15_wrong_event` to Gate validation result states.

Navigation research conclusions:

- Visitors need an obvious top-level sign-in path, not a buried account menu.
- Customer ticket access should be easy to reach from the public site and from
  authenticated navigation.
- Organizer entry should be visible but clearly separate from customer browsing.
- Gate staff benefit from a minimal, task-focused landing that goes directly to
  event selection and validation.
- Shared login entry with role choice is a reasonable pattern when the backend
  still owns authorization decisions.

Reference copy, dates, prices, counts, images, identities, and credentials remain
illustrative. Product requirements and live API/state values take precedence over
reference examples; screenshots guide visual composition and HTML guides structure.
