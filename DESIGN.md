---
name: Kinetic Admission
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#37393a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#d2c5ac'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#9b9079'
  outline-variant: '#4e4633'
  surface-tint: '#f3c019'
  primary: '#ffebc0'
  on-primary: '#3e2e00'
  primary-container: '#feca27'
  on-primary-container: '#6f5600'
  inverse-primary: '#755b00'
  secondary: '#c8c6c3'
  on-secondary: '#31302e'
  secondary-container: '#474744'
  on-secondary-container: '#b7b5b1'
  tertiary: '#c2f5ff'
  on-tertiary: '#00363d'
  tertiary-container: '#00e5fe'
  on-tertiary-container: '#00626e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdf92'
  primary-fixed-dim: '#f3c019'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#594400'
  secondary-fixed: '#e5e2de'
  secondary-fixed-dim: '#c8c6c3'
  on-secondary-fixed: '#1c1c1a'
  on-secondary-fixed-variant: '#474744'
  tertiary-fixed: '#9af0ff'
  tertiary-fixed-dim: '#00daf2'
  on-tertiary-fixed: '#001f24'
  on-tertiary-fixed-variant: '#004f58'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
  ticket-void: '#FF3B30'
  ticket-valid: '#34C759'
  ticket-paper: '#F5F7F8'
  deep-navy: '#1A2337'
typography:
  display-xl:
    fontFamily: Anton
    fontSize: 84px
    fontWeight: '400'
    lineHeight: 84px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Anton
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 52px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Anton
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 40px
  subheading:
    fontFamily: Libre Franklin
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-md:
    fontFamily: Libre Franklin
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-mono:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 64px
  ticket-perforation: 12px
---

## Brand & Style

The design system is built upon the high-stakes energy of live events and the tactile heritage of physical admission stubs. It targets a premium audience that values exclusivity and clear, authoritative information. The aesthetic avoids the softness of modern SaaS in favor of a **High-Contrast / Bold** and **Brutalist** hybrid.

By leveraging sharp edges, heavy verticality, and a single high-energy accent against a deep monochromatic base, the system evokes the feeling of an editorial event poster. It is designed to look intentional, prestigious, and urgent—mirroring the excitement of a ticket drop and the finality of a gate check.

## Colors

The palette is strictly high-contrast to ensure maximum legibility for gate staff under varying light conditions.

- **Primary:** A "Bold Amber" (#FECA27) serves as the singular chromatic focus, used for calls to action, active ticket indicators, and premium branding.
- **Backgrounds:** The interface defaults to a "Deep Carbon" (#1D1D1B) to allow the accent color and white typography to pop with maximum intensity.
- **Validation:** Semantic colors for ticket status (Valid, Invalid, Used) are desaturated but high in value to maintain the editorial look without feeling "cheap."
- **Inversion:** Organizers' desktop views may utilize "Ticket Paper" (#F5F7F8) backgrounds for data-heavy management, while customer-facing mobile views remain predominantly dark.

## Typography

This design system uses a triple-font strategy to balance impact with utility:
1. **Display (Anton):** Used for large event titles and ticket types. It provides the "poster" aesthetic. It should always be uppercase in display roles.
2. **Functional (Libre Franklin):** A clean, dependable sans-serif for body copy, event descriptions, and organizer settings.
3. **Data (Space Mono):** Used for ticket IDs, dates, seat numbers, and validation states, reinforcing the "printed stub" metaphor.

Maintain tight line heights for headlines to create a dense, authoritative block of text. Use wide letter spacing for `label-caps` to ensure readability at small sizes.

## Layout & Spacing

The layout follows a **Fixed Grid** model for desktop organizers and a **Fluid-Margin** model for mobile customers.

- **Mobile:** Elements are packed tightly to maximize the visibility of the QR code and ticket details. A 4-column grid is used with 16px gutters.
- **Desktop:** A 12-column centered grid is used for the organizer dashboard, providing ample whitespace (margins) to manage complex data tables.
- **The Ticket Rhythm:** Components should use an 8px base spacing unit, but vertical "perforations" (spacing gaps) should use the `ticket-perforation` unit to create the visual effect of a detached stub.

## Elevation & Depth

Depth is conveyed through **Bold Borders** and **Tonal Layering** rather than shadows.

- **Surface Tiers:** Background is #1D1D1B. Cards use #1A2337 or #2D2D2B. This creates a "stacked paper" effect without needing blurs.
- **Borders:** All primary containers use a 1px or 2px solid border (often in #FFFFFF or the primary accent) to define edges sharply.
- **The Stencil Effect:** Use negative space (cut-outs) to simulate perforated edges. Instead of a shadow casting a lift, use a high-contrast border to make a "ticket" appear as if it is sitting on top of the interface.

## Shapes

The design system strictly uses **Sharp (0px)** corners. This reinforces the "cut paper" and "industrial" feel of event tickets.

**Perforation Detail:** To create the ticket-stub look, use CSS mask-images or SVG paths to "punch" circular divots into the left and right sides of cards where the header meets the body. This is the only "round" element allowed in the system, and it must be a subtractive shape (a cut-out), never an additive rounded corner.

## Components

### Buttons
- **Primary:** Sharp-edged, background #FECA27, text #000000. On hover, invert or shift to a slightly darker amber.
- **Secondary:** Sharp-edged, 2px white border, transparent background, white text.
- **Validation:** Buttons for gate staff should occupy the full width of the mobile screen for easy thumb-access.

### Ticket Cards
- Divided into two sections (Header/Stub and Body).
- A dashed line (border-style: dashed) should separate the "stub" from the "info" area.
- Use `data-mono` for all technical details like Row, Seat, and Section.

### Input Fields
- Minimalist bottom-border only or a 1px solid white box.
- Placeholder text should be low-opacity white.
- Error states use #FF3B30 with a "REJECTED" label in `label-caps`.

### Chips & Tags
- Used for event categories (e.g., "VIP", "SOLD OUT").
- Rectangular with heavy borders. No rounded corners.

### Validation States
- **Valid:** Card border changes to 4px #34C759. Large "VALID" watermark in `headline-lg`.
- **Invalid/Used:** Card opacity drops to 60%, with a diagonal "VOID" or "USED" strike-through using the `anton` font.

# Kinetic Admission Design System

## Brand Vision
Kinetic Admission is designed to bridge the gap between digital convenience and the tactile, high-energy experience of live events. Moving away from generic SaaS aesthetics, the system draws inspiration from physical ticket stubs, editorial typography, and brutalist cinema posters.

## Visual Principles
- **High Contrast:** Using a deep charcoal base with vibrant amber accents for maximum legibility and impact.
- **Editorial Typography:** Bold, condensed headings that command attention and establish a clear information hierarchy.
- **Tactile Elements:** Perforated edges, ticket-shaped containers, and subtle industrial textures (like scan lines and status badges).
- **Functional Color:** Unmistakable status colors (Green/Red/Yellow) optimized for fast-paced operational environments like gate scanning.

## Design Tokens

### Colors
| Token | Hex | Usage |
| :--- | :--- | :--- |
| **Surface** | `#121414` | Main application background |
| **Primary (Accent)** | `#FECA27` | Primary CTA, focus states, and branding |
| **On-Surface** | `#FFFFFF` | Primary text and headings |
| **On-Surface-Variant**| `#B0B3B3` | Secondary text and labels |
| **Success** | `#1DB954` | Valid ticket status and approvals |
| **Error** | `#FF4B3E` | Invalid tickets, declines, and alerts |
| **Outline** | `#37393A` | Borders and dividers |

## Component Library

### Navigation
- **TopAppBar:** Minimalist header with brand identity and quick profile access.
- **BottomNavBar (Mobile):** High-contrast navigation for Customer experience (Explore, Search, Tickets).
- **NavigationDrawer (Desktop):** Persistent sidebar for Organizer Studio management.

### Cards & Containers
- **Ticket Stub:** Rounded containers with simulated perforation (`border-dashed`).
- **Status Banners:** Full-width, high-color banners for validation feedback (VALID, INVALID).

## Experience Standards
- **Customer:** Mobile-first, focused on discovery and the "Moment of Entry."
- **Organizer:** Desktop-optimized, high data density for inventory management.
- **Gate:** Maximum contrast, oversized status indicators, and large touch targets.

---

# System Design (Frontend)

This section documents the actual architecture of `apps/web`, as implemented — not the visual/brand system above. Stack: **Next.js 16 (App Router)**, **React 19**, **TypeScript 7** (`strict: true`), **Bootstrap 5**, **Vitest 4** + Testing Library.

## Folder Structure

Flat App Router layout, no `src/` directory:

- **`app/`** — routes only, one segment per user-facing area:
  - `app/page.tsx`, `app/search/page.tsx` — public discovery/search
  - `app/events/[eventId]/page.tsx` (+ `not-found.tsx`), `app/events/[eventId]/reserve/page.tsx` — event detail and seat/sector picker
  - `app/login/page.tsx`, `app/register/page.tsx` — auth forms
  - `app/customer/tickets/page.tsx`, `app/customer/tickets/[ticketId]/page.tsx`, `app/customer/checkout/[reservationId]/page.tsx` — customer area
  - `app/organizer/events/page.tsx`, `app/organizer/events/new/page.tsx`, `app/organizer/catalog/page.tsx` — organizer studio
  - `app/gate/page.tsx` — gate/door-staff scanner
  - `app/shared/tickets/[shareToken]/page.tsx` — public, unauthenticated read-only ticket view
  - `app/layout.tsx` / `app/globals.css` — single root layout and theme layer
  - No route groups, no `app/api/*` route handlers, no nested layouts, no `middleware.ts`.
- **`components/`** — organized by feature/domain: `shell/`, `events/`, `booking/`, `checkout/`, `tickets/`, `gate/`, `states/`.
- **`lib/`** — one concern per file: `api.ts` (backend client), `auth.ts` (session types + `localStorage` helpers), `session.tsx` (React Context provider), `reservation-store.ts` (`sessionStorage` checkout handoff), `availability.ts`, `seating.ts` (seat/sector layout heuristic), `format.ts` (pt-BR date/money formatting), `qr.ts` (from-scratch QR matrix encoder).

## Rendering Strategy

Split by data sensitivity: routes that only need public/shareable data are **async Server Components**; anything requiring session state, forms, or interactivity is `"use client"`.

- Server Components: `app/page.tsx`, `app/search/page.tsx`, `app/events/[eventId]/page.tsx`, `app/shared/tickets/[shareToken]/page.tsx`. Each sets `export const dynamic = "force-dynamic"` — no static caching of event/ticket data.
- Client Components: `login`, `register`, `customer/*`, `organizer/*`, `gate`, `events/[eventId]/reserve` — anywhere `useSession`, forms, or role-gating is needed. The root `app/layout.tsx` stays a Server Component and wraps children in the client `SessionProvider`.
- No Server Actions (`"use server"`) — mutations go through the client-side `lib/api.ts` `fetch` wrapper called from event handlers.
- No `app/api/*` route handlers — the Next app never proxies the backend itself; it calls the FastAPI service directly from server or client code.

## Data Fetching / API Layer

A single hand-rolled client in `lib/api.ts`, no React Query/SWR:

- Base URL resolution is environment-aware:
  ```ts
  const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
  const SERVER_API_BASE = process.env.API_INTERNAL_BASE_URL ?? "http://api:8000/api/v1";
  function getApiBase() {
    return typeof window === "undefined" ? SERVER_API_BASE : PUBLIC_API_BASE;
  }
  ```
  Server Components hit the Docker-internal `api:8000` host; the browser hits `localhost:8000` (or `NEXT_PUBLIC_API_BASE_URL`). Both env vars are wired in `compose.yaml`.
- A single `request<T>()` helper drives every call with `cache: "no-store"`, JSON headers, and a typed `ApiError` (status/code/message) built from the backend's `{error:{code,message}}` envelope, with Portuguese fallback messages per HTTP status.
- Auth is opt-in per call via `{ auth: true }`, which reads the token from `readStoredSession()` and sets `Authorization: Bearer <token>`. No cookies are used anywhere.
- Retry-sensitive mutations (`submitPayment`, `validateGateTicket`) pass an explicit `Idempotency-Key` — the gate scanner mints a fresh UUID per attempt so retries don't mask an `ALREADY_USED` result.
- All API surface (events, reservations, payments, tickets/share, organizer CRUD, external catalog, gate validation) lives in this one file as typed functions returning typed `*Api` DTOs.

> Note: `docs/api-reference.md` is known to drift from the running backend's actual schema in places (event shape, declined reservations, gate idempotency) — verify against `apps/api` directly rather than trusting the doc when in doubt.

## State Management

No global state library (no Redux/Zustand/Jotai). Two mechanisms only:

- **`lib/session.tsx`** — a `"use client"` React Context (`SessionProvider` / `useSession`) holding `{accessToken, expiresAt, role, email, displayName}`, hydrated from `localStorage` inside a `useEffect` (SSR renders logged-out, then hydrates) with a `ready` flag to avoid a flash of the wrong state. `useSession()` degrades to a safe no-op outside the provider.
- Everything else is local `useState`/`useCallback` per component.
- Two persistence helpers sit outside React: `lib/auth.ts` (session read/write/clear in `localStorage`, key `elite-tickets.session`) and `lib/reservation-store.ts` (reservation snapshot in `sessionStorage`, handing off from the seat picker to checkout without a re-fetch).

## Auth & Access Control

- **No `middleware.ts`** — there is no route-level/edge auth gating. All access control is client-side, via `RequireRole` (`components/shell/require-role.tsx`):
  ```tsx
  export function RequireRole({ role, children }) {
    const { session, ready } = useSession();
    if (!ready) return <LoadingState .../>;
    if (!session) return <UnauthorizedState />;
    if (session.role !== role) return <UnauthorizedState title="Perfil incorreto..." />;
    return <>{children}</>;
  }
  ```
  This is presentation-only gating; the backend remains the real authority for every action.
- Three roles: `CUSTOMER`, `ORGANIZER`, `GATE`, each with a home path (`roleHomePath()`) and display label (`ROLE_LABELS`).
- Login/register convert the backend token response into a `SessionState`, call `signIn()` to persist it and redirect to the role's home. Login supports `?next=`, used by `PurchaseCta` to return unauthenticated buyers to checkout post-login (customer role only).
- Session expiry is checked client-side (`isExpired` vs `expiresAt`); an expired session is silently dropped on read.
- **Token storage is `localStorage` only** — no cookies, no HttpOnly storage. This is an accepted XSS-exposure tradeoff for this project's stage, not an oversight — flag it before hardening for production.

## Component Architecture

Feature/domain-organized, not atomic-design tiers:

- `components/shell/` — `AppShell` (customer/public: `TopBar` + content + `BottomNav`), `StudioShell` (organizer: sidebar + header), `RequireRole`.
- `components/events/` — `EventCard`, `EventList`, `EventHero`, `EventDetail`, `EventSearch`, `PurchaseCta` (role/session-aware CTA).
- `components/booking/` — `SeatMap` and `SectorPicker`, chosen by `lib/seating.ts`'s `venueLayout()` keyword heuristic (e.g. "cinema"/"theat"/"imax" → seats, else sectors).
- `components/checkout/` — `HoldCountdown` (live countdown to reservation expiry), `OrderStub` (ticket-stub order summary).
- `components/tickets/` — `TicketCard`, `QrCode` (renders the `lib/qr.ts` matrix as inline SVG).
- `components/gate/` — `CameraScanner` (wraps the `qr-scanner` package against a `<video>` ref, starts/stops on an `active` prop, decode callback via a stable ref to avoid re-instantiating the scanner) and `GateStatus`. Used only in `app/gate/page.tsx`, feeding into the same `validateGateTicket` path as a manual-paste textarea fallback.
- `components/states/states.tsx` — shared async/error primitives (`LoadingState`, `EmptyState`, `ErrorState`, `UnauthorizedState`, `SkeletonCard`) reused across nearly every page.

## Styling

Bootstrap-only, per the standing project rule — no Tailwind, no CSS-in-JS, no CSS Modules:

- `bootstrap/dist/css/bootstrap.min.css` is imported once in `app/layout.tsx`, followed by `app/globals.css`.
- Theming is entirely via CSS custom properties: brand tokens (`--et-surface`, `--et-accent`, etc.) map onto Bootstrap variables (`--bs-body-bg`, `--bs-border-radius: 0`, `--bs-warning`, `--bs-danger`, …) under `:root, [data-bs-theme="dark"]`; `data-bs-theme="dark"` is set on `<html>` in the root layout.
- Component overrides (`.btn`, `.card`, `.form-control`, `.badge`, `.navbar`, `.table`) use Bootstrap's own per-component CSS variable API (`--bs-btn-*`, `--bs-card-*`) rather than raw property overrides.
- A small set of bespoke, non-Bootstrap classes (`.rail`, `.bottom-nav`, `.seat`, `.stub`/`.perf`, `.scanner-frame`, `.gate-result`, `.poster`, `.qr`) cover product-specific UI (seat grid, ticket-stub perforation, scanner frame) — additive, not overrides of existing Bootstrap components. Mostly variable-driven, though a few literal hex values remain (e.g. `.seat { background-color: #282a2b; }`) and should be migrated to `--et-*`/`--bs-*` tokens when touched.
- Bootstrap utility classes (`d-grid`, `d-flex`, `container`, `row`/`col-*`) are used directly in JSX for layout.

## Testing

Vitest + `jsdom` + Testing Library (`vitest.config.mjs`: `jsdom` environment, `@/` alias mirroring `tsconfig.json`, setup file `tests/setup.ts` which polyfills `localStorage`/`sessionStorage` and auto-cleans after each test).

- `api.test.ts` — mocks global `fetch`, asserts query-string building, auth header injection, idempotency headers, error mapping.
- `auth.test.ts` — session serialize/parse/expiry logic.
- `format.test.ts` — date/money formatting.
- `qr.test.ts` — QR encoder correctness.
- `booking.test.tsx` — renders `SeatMap`/`SectorPicker` with Testing Library + `userEvent`, driven by fixtures (`tests/fixtures/events.ts`) exercising `venueLayout()` branching.
- `gate.test.tsx`, `gate-camera.test.tsx` — gate flow and camera scanner behavior.
- Unit/component-level only — no Playwright/Cypress, no e2e runner.

## Build & Deploy

- **`Dockerfile`**: `node:22-alpine`, `npm ci`, then `npm run dev -- --hostname 0.0.0.0 --port 3000` as `CMD` — the container currently runs the **Next.js dev server**, not a production build. Fine for local/demo compose, but flagged here as a gap before any real deploy (`next build && next start`, or standalone output).
- **`compose.yaml`**: `web` depends on a healthy `api` service; sets `API_INTERNAL_BASE_URL` (container-to-container) and `NEXT_PUBLIC_API_BASE_URL` (browser-facing); healthcheck does a plain `fetch('http://localhost:3000')`.
- **No `next.config.*`** — default Next config, no rewrites/proxies, no `next/image` (plain `<img>` with `eslint-disable @next/next/no-img-element`).
- **`tsconfig.json`**: `strict: true`, `moduleResolution: "bundler"`, single alias `"@/*": ["./*"]` used everywhere (`@/lib/...`, `@/components/...`).

## Cross-Cutting Concerns

- **Errors**: no `error.tsx` boundaries anywhere; `lib/api.ts` failures are caught per-page/component and rendered via `ErrorState` (with optional `onRetry`). Server Component pages catch fetch failures inline and render `ErrorState` rather than throwing.
- **Loading**: no `loading.tsx` Suspense boundaries; `LoadingState` is rendered manually while `useState`-tracked data is pending. `useSearchParams()` usages (`login`, `organizer/events/new`) are wrapped in `<Suspense>` per Next's requirement.
- **Not found**: only one `not-found.tsx`, scoped to `app/events/[eventId]/`, triggered via `notFound()` when the event fetch fails. No global `app/not-found.tsx`.
- **Role mismatch**: reuses `UnauthorizedState` with login/register CTAs in-place, rather than redirecting away.

## Known Gaps / Follow-ups

- No edge/route-level auth (`middleware.ts`) — role gating is fully client-side and trusts the backend as final authority.
- Token storage in `localStorage` (no HttpOnly cookie) — acceptable for now, revisit before hardening.
- Container runs `next dev`, not a production build — revisit `Dockerfile` before any real deploy.
- `docs/api-reference.md` drifts from the actual backend schema in places — see project memory `project-api-doc-drift`.
