# Research: Frontend Design Refactor

## Decision: retain Next.js App Router and npm

- **Evidence**: `apps/web/package.json` uses `next dev`, `next build`, npm lockfile,
  Next 15.5.23, React 19.2.8, and App Router files under `apps/web/app/`.
- **Rationale**: changing framework or package manager would add risk unrelated to
  visual refactoring and could break server/client boundaries.
- **Alternatives considered**: Vite/React Router and Tailwind were rejected because
  neither is present in the repository.

## Decision: extend existing CSS tokens and primitives

- **Evidence**: `apps/web/app/globals.css` defines visual tokens/layout utilities;
  `components/ui` already contains Button, Ticket, Status, LedgerRow and
  Perforation.
- **Rationale**: it preserves the approved editorial language and minimizes bundle
  and regression risk.
- **Alternatives considered**: introducing Tailwind, CSS Modules, or a component
  library was rejected as unnecessary new infrastructure.

## Decision: preserve API/auth boundaries

- **Evidence**: `lib/api.ts` normalizes HTTP errors and supports internal/public API
  base URLs; `lib/auth.ts` persists JWT sessions and role navigation/guards.
- **Rationale**: the feature changes composition, not data contracts or security.
- **Alternatives considered**: a new client cache/state library was rejected; no
  requirement demonstrates a need for it.

## Decision: use stateful components for standalone references

- **Evidence**: existing checkout renders approved/declined/expired results and
  gate renders validation results in `/customer/checkout/[eventId]` and `/gate`.
- **Rationale**: references 04–05 and 12–15 describe post-action states, not
  independently navigable product resources.
- **Alternatives considered**: adding routes for each result was rejected because it
  would alter routing and make refresh/deep-link behavior misleading.

## Decision: visual validation without new screenshot tooling

- **Evidence**: Playwright is already installed and existing E2E/accessibility
  suites cover the main flows; no visual-regression runner is configured.
- **Rationale**: use existing browser checks plus manual screenshot review at the
  reference dimensions, avoiding heavy tooling and snapshot churn.
- **Alternatives considered**: adding Percy/Chromatic or a new screenshot service
  was rejected as disproportionate for this refactor.
