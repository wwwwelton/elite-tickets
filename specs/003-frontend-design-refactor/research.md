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

## Decision: keep role navigation derived from session state

- **Evidence**: `apps/web/lib/auth.ts` already persists the JWT session, resolves
  the authenticated role home, and blocks disallowed routes by redirecting to the
  current session role home rather than inventing a second auth state.
- **Rationale**: the shared shell can render visitor, customer, organizer, and
  gate navigation by reading the existing session helper without altering session
  storage or backend authority.
- **Alternatives rejected**: duplicating session logic in the shell or changing
  guard destinations would make the frontend a second source of truth.

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

## Route and component audit

Verified application routes in the current frontend:

- `/` public home and event discovery.
- `/events/[eventId]` public event detail.
- `/login` authentication entry.
- `/customer/checkout/[eventId]` customer checkout.
- `/customer/tickets` customer ticket list.
- `/customer/tickets/[ticketId]` customer ticket detail.
- `/shared/tickets/[shareToken]` read-only shared ticket.
- `/organizer/events` organizer event ledger.
- `/organizer/events/new` organizer create-event workflow.
- `/gate` gate validation workspace.

Shared reusable components currently in use:

- `components/auth/app-shell.tsx` for role-aware shell/navigation.
- `components/auth/login-form.tsx` for authentication entry.
- `components/auth/route-access-state.tsx` for auth-required/access-denied messaging.
- `components/events/event-list.tsx` and `components/events/event-card.tsx` for discovery.
- `components/events/event-form.tsx` and `components/events/organizer-ledger.tsx` for organizer workflows.
- `components/checkout/checkout-flow.tsx` for reservation/payment states.
- `components/tickets/my-tickets.tsx`, `components/tickets/ticket.tsx`, `components/tickets/share-action.tsx`, `components/tickets/scanner.tsx`, and `components/tickets/validation-result.tsx` for ticket, share, and validation states.

All 15 approved page groups remain represented by these routes or states; the
payment and gate mockups are state references, not additional routes.
The current application still maps all 15 approved page groups and keeps the
route coverage aligned with the design inventory verified for this feature.

## Auth and guard audit

Verified session behavior in `apps/web/lib/auth.ts`:

- Sessions are stored in `window.sessionStorage` under `elite-tickets.session`.
- Session shape is `{ accessToken, expiresAt, role }`.
- Expired or malformed sessions are cleared and treated as signed out.
- Role-specific navigation is derived from the saved session role.
- `roleHome()` returns `/organizer/events`, `/customer/tickets`, or `/gate`
  depending on the authenticated role.
- `guardRoute()` returns `auth_required` for signed-out users and
  `access_denied` for authenticated users who attempt another role's route.
- `guardRoute()` redirects access-denied users to their own role home; it does
  not invent a new authorization model or bypass backend authority.

Frontend navigation consumes these helpers; it does not replace backend
authentication or authorization decisions.

## Navigation gap audit

Before the refactor, the usable shell was missing or unclear in these areas:

- Login/Entrar was not consistently surfaced from the public browsing path.
- My Tickets had no obvious top-level customer entry from the shell.
- Organizer entry was easy to miss from the public experience.
- Create Event was not exposed as a first-class organizer action.
- Gate/Portaria entry was not clearly separated as a distinct role path.
- Logout was not persistently visible across authenticated contexts.

Those gaps are the reason the current shell and role-aware links were added.
They are now addressed in the application, but the verification remains relevant
for future regressions.

## Mismatches and constraints

Verified design-to-product constraints:

- Reference screenshots and HTML include illustrative copy, names, prices,
  times, inventory values, and credentials. Those values must not replace live
  app state.
- `docs/design/` is immutable for this feature and was not modified.
- `screen.png` is the primary visual reference; `code.html` is structural only.
- Approved product behavior takes precedence if a visual reference appears to
  conflict with the PRD, constitution, or backend behavior.

Verified mismatch handling:

- The approved reference set does not provide dedicated mockups for every error
  or loading state. The existing application states remain required and must be
  preserved, even when no Stitch art exists for them.
- Shared ticketing must remain read-only and security-bound by the existing
  backend model; the visual treatment cannot make it public or editable.
