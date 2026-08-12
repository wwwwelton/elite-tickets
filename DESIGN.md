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
