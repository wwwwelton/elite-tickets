# Research: Frontend Design Refactor

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
