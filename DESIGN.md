---
name: EliteTickets Narrative
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#e8bcb6'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#ae8782'
  outline-variant: '#5e3f3b'
  surface-tint: '#ffb4aa'
  primary: '#ffb4aa'
  on-primary: '#690003'
  primary-container: '#e61919'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0000b'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#a1c9ff'
  on-tertiary: '#00325a'
  tertiary-container: '#0077cd'
  on-tertiary-container: '#fdfcff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930006'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#d2e4ff'
  tertiary-fixed-dim: '#a1c9ff'
  on-tertiary-fixed: '#001c38'
  on-tertiary-fixed-variant: '#004880'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Bodoni Moda
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Bodoni Moda
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  code-data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 64px
---

## Brand & Style

This design system is built on an **Editorial Brutalist** aesthetic, drawing inspiration from the tactile nature of physical cinema tickets, high-end event posters, and vintage playbills. The personality is authoritative, premium, and stark, moving away from the "softness" of modern SaaS towards a high-impact, information-dense layout.

The visual language emphasizes structural integrity through heavy borders, perforated dividers, and a strict adherence to a grid. It evokes the feeling of a limited-edition physical artifact. The emotional response should be one of exclusivity and clarity, where every piece of data—time, seat, price—is treated with the importance of a headline.

- **Minimalism:** Use whitespace as a structural tool, not just "breathing room."
- **High-Contrast:** Absolute blacks and whites to ensure accessibility and dramatic impact.
- **Tactile:** Implementation of dashed lines and "cut-out" shapes to mimic paper tickets.

## Colors

The palette is intentionally restricted to create a singular focal point and maintain maximum contrast.

- **Primary (Cinema Red):** Used exclusively for calls to action, high-priority status indicators, and critical branding elements. It is the "punch" in the monochromatic environment.
- **Neutral High (White):** Used for primary text and secondary buttons.
- **Neutral Base (Black):** The canvas. A true #000000 background to emphasize the "black box" theater experience.
- **Data Accents:** A secondary neutral gray (#888888) may be used sparingly for metadata that is not critical to the immediate user flow.

All text combinations must exceed AA accessibility standards, favoring the high-contrast pairing of pure white on black.

## Typography

The typography system relies on a sharp contrast between three distinct voices:

1.  **The Editorial Voice (Bodoni Moda):** High-contrast serif used for event titles and large display headers. It evokes the elegance of fashion editorials and movie posters.
2.  **The Functional Voice (Inter):** A neutral sans-serif for descriptions, settings, and general UI labels. It ensures legibility when reading long event details.
3.  **The Technical Voice (JetBrains Mono):** A monospaced font reserved for "ticket data"—seat numbers, confirmation codes, dates, and prices. This reinforces the "issued ticket" aesthetic.

**Styling Note:** Use `label-caps` for section headers and metadata titles to create clear horizontal anchors in the layout.

## Layout & Spacing

The layout is governed by a **strict 12-column fixed-width grid** on desktop and a **4-column fluid grid** on mobile.

- **Grid Lines:** Unlike modern designs that hide the grid, this system can utilize visible vertical or horizontal rules (1px white lines) to separate content sections.
- **The "Ticket" Container:** Major content blocks (like individual tickets) should have a max-width and be centered, mimicking the physical size of a ticket stub.
- **Spacing Rhythm:** Use a 4px baseline, but favor large "stacks" (32px, 64px) to separate primary sections. Content should feel dense within a module but separated by significant gaps from other modules.

## Elevation & Depth

This design system is **flat**. It rejects shadows, blurs, and Z-axis depth in favor of **structural layering**.

- **Tonal Layers:** Hierarchy is established by "cutting into" the black background with white containers or 1px white borders.
- **Visual Separation:** Use dashed (perforated) lines for secondary separations and solid 2px lines for primary separations.
- **Inversion:** Use color inversion for hover states. If a button is white text on a black background, the hover state is black text on a white background. No "soft" shadow transitions are allowed.

## Shapes

The shape language is **Sharp (0)**.

- **Corners:** All buttons, cards, and input fields must have 0px border-radius.
- **Ticket Notches:** To evoke a physical ticket, use CSS `mask-image` or `clip-path` to create semi-circle "notches" on the left and right sides of container dividers.
- **Borders:** Standard border width is 1px. Primary containers or highlighted items use 3px borders for emphasis.

## Components

### Buttons
- **Primary:** Solid Cinema Red background, white `label-caps` text. No rounded corners.
- **Secondary:** Solid White background, black text.
- **Ghost:** 1px white border, white text.
- **Interaction:** On hover, primary buttons shift to a darker red; secondary buttons invert to black background/white text.

### Ticket Cards
- The primary unit of the UI. Must feature a "perforation" line (dashed border) separating the event image/title from the technical data (time/seat).
- Use `code-data` for all numeric values.

### Input Fields
- Underline style only (bottom border 1px white).
- Labels stay above the input in `label-caps` at all times.
- Focus state: Bottom border increases to 2px Cinema Red.

### Lists
- Separated by 1px solid white lines.
- Each list item should feel like a row in a ledger.
- Use Monospaced fonts for right-aligned data points (e.g., prices).

### Status Indicators
- **Sold Out:** Stamped appearance. Diagonal text in a thick border box, rotated 5 degrees, using Cinema Red.
- **Available:** Plain white text in a box.

### Perforation Divider
- A horizontal element consisting of a `dashed` border-top. Often paired with a circular "punch-out" on either end of the container to complete the ticket aesthetic.
