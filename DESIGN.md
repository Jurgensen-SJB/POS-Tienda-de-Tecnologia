---
name: Retail Ops Standard
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#ac0031'
  on-tertiary: '#ffffff'
  tertiary-container: '#d71142'
  on-tertiary-container: '#ffecec'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdada'
  tertiary-fixed-dim: '#ffb3b6'
  on-tertiary-fixed: '#40000c'
  on-tertiary-fixed-variant: '#920028'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  tabular-numeric-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  tabular-numeric-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  tabular-numeric-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.5rem
  margin: 1.5rem
  margin-docked: 1rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers an ergonomic, enterprise-grade operating interface designed for modern retail environments, cashier point-of-sale registers, and back-office inventory dashboards. It balances high data density with instantaneous visual clarity. Rapid retail checkouts require zero ambiguity, lightning-fast visual parsing, and high-contrast tactile feedback under varying store lighting conditions.

The visual style is **Corporate / Modern** merged with high-efficiency tabular utilities. Structural elements rely on balanced borders, clean surfaces, structured information grids, and strict visual hierarchies rather than ornamental decoration. Every component is optimized for both desktop mouse workflows and hybrid touch-screen terminal inputs, prioritizing dependable muscle memory, robust accessibility, and zero-latency decision making.

## Colors

The system uses a focused color palette engineered for operational precision and rapid transactional status recognition.

- **Primary Accent (`#2563EB`)**: Used for affirmative system paths, focused inputs, active table row selections, primary checkout actions, and major workflow indicators.
- **Secondary / Success (`#059669`)**: Reserved strictly for completed sales, approved tender authorizations, positive stock deltas, cash drawer reconciliations, and verified register balances.
- **Tertiary / Destructive (`#E11D48`)**: Dedicated to line voids, order cancellations, negative adjustments, refund processing, and critical hardware/network errors.
- **Warning / Alert (`#D97706`)**: Denotes pending card processing, low stock thresholds, price override alerts, and offline sync notifications.
- **Neutral Palette (`#0F172A` to `#F8FAFC`)**:
  - Background Canvas: `#F8FAFC` provides an ultra-clean, glare-free workspace.
  - Surface Default: `#FFFFFF` for data grids, receipt panels, and modal layers.
  - Surface Subdued: `#F1F5F9` for table header bands, disabled states, and auxiliary panels.
  - Borders & Dividers: `#E2E8F0` for structural separation and `#CBD5E1` for actionable control boundaries.
  - Text Primary: `#0F172A` providing maximum WCAG AAA contrast ratio.
  - Text Secondary: `#475569` for tabular metadata, category labels, and secondary metrics.

## Typography

Inter serves as the universal typeface across all display, transactional, and body hierarchies due to its exceptional x-height, neutral letterforms, and robust OpenType feature set.

To ensure rapid alignment across dense retail tables, price tallies, barcode listings, and receipt logs, all numeric values use OpenType tabular lining figures (`font-variant-numeric: tabular-nums lining-nums`). This guarantees identical character widths across digits `0-9`, eliminating horizontal jitter when totals recalculate.

Key typography conventions:
- **Totals and Checkout Totals**: Rendered in `tabular-numeric-lg` or `headline-xl` with right alignment.
- **Inventory SKUs and Barcodes**: Formatted in `tabular-numeric-sm` using uppercase letter-spacing to prevent visual clumping.
- **Labels & Column Headers**: Rendered in `label-sm` with uppercase transformation and a subtle `0.04em` tracking to distinguish field labels from editable table content.

## Layout & Spacing

The layout architecture relies on a full-bleed, high-density split view optimized for desktop monitors, widescreen touch registers, and fixed counter displays.

### Structure
- **Persistent Side Navigation**: Fixed 64px collapsed icon rail expanding to 240px for multi-store management, shifts, and reports.
- **Primary Workspace (Variable / Split Screen)**:
  - **Left / Center Zone**: Dynamic catalog, barcode lookup, search filter bar, and product selection matrix (60–70% width).
  - **Right Docked Rail**: Permanent cart and transaction execution panel (30–40% width, min 360px, max 480px).
- **Tabular Data Views**: Full-width data table views with sticky column headers, horizontally pinned status columns, and sticky batch action footers.

### Density and Ergonomics
Components operate under an 8px base rhythm with 4px micro-increments. High-density data tables use 36px to 40px row heights for dense inventory scans, while touch-enabled checkout tiles use 48px minimum target heights to eliminate miss-clicks during rapid customer checkouts.

## Elevation & Depth

This system avoids heavy drop shadows and ornamental diffusion in favor of structured structural lines and functional surface tiers. Clean demarcation between interactive levels reduces visual fatigue across 8-hour cashier shifts.

- **Level 0 (App Canvas)**: Ground layer (`#F8FAFC`), no elevation.
- **Level 1 (Panels & Cards)**: Base data surface (`#FFFFFF`) with a 1px solid border (`#E2E8F0`) and an ambient micro-shadow (`0 1px 2px 0 rgba(15, 23, 42, 0.04)`).
- **Level 2 (Dropdowns, Flyouts & Search Auto-complete)**: Lifted actionable overlay with crisp perimeter definition (`0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`) bounded by a 1px border (`#CBD5E1`).
- **Level 3 (Modals, Tender Screens & Cash Drawers)**: High-focus interaction layers backed by a 40% `#0F172A` dimming shield, elevated by `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`.
- **Level 4 (Toasts & Offline Hardware Notices)**: Pinned alert banners floating above modals with high-contrast borders and sharp directional elevation.

## Shapes

The design system uses a restrained corner radius (`0.25rem` / 4px base) that matches its industrial, utilitarian personality.

- **Base Radius (`0.25rem`)**: Standard interactive controls including text fields, primary POS buttons, table cell selections, and dropdown triggers.
- **Medium Radius (`0.5rem`)**: Surfaces, payment method cards, modal dialogs, and persistent dock containers.
- **Pill / Maximum Radius (`9999px`)**: Status badges, stock indicator chips, and barcode scanner read indicators only.

This subtle corner curvature maintains maximum usable grid real estate within dense multi-row tabular displays, avoiding wasted cell margins caused by larger border radii.

## Components

### Buttons & Quick-Action POS Tiles
- **Primary Checkout Button**: Full-width or oversized (minimum height 48px), solid `#2563EB` fill with white text, font-weight 600. Active states drop 1px via subtle inset shadow.
- **Payment Tender Keys (Cash / Card / Split)**: Outlined `#CBD5E1` buttons with bold numeric label, background `#FFFFFF`, changing to `#F1F5F9` on press. Cash button features emerald `#059669` left-edge indicator.
- **Danger Actions (Void Line / Cancel Sale)**: Subdued `#FEE2E2` fill with `#E11D48` text; transitions to solid `#E11D48` with white text on press or hold to prevent accidental triggers.

### Status Badges & Chips
- Compact dimensions: height 22px, padding 2px 8px, font-size 11px uppercase bold.
- **In Stock / Paid**: `#DCFCE7` background, `#166534` text, optional leading 6px dot indicator.
- **Low Stock / Pending Sync**: `#FEF3C7` background, `#92400E` text.
- **Out of Stock / Voided**: `#FFE4E6` background, `#9F1239` text.

### Data Tables & Cart Item Lists
- Row height: 40px standard, 32px ultra-dense mode.
- Borders: Horizontal only (`1px solid #E2E8F0`), eliminating vertical noise.
- Selection: Active line item highlighted with a 5% `#2563EB` tint and a 3px solid `#2563EB` left-border accent.
- Alignment: Text left-aligned; quantities, discounts, and currency totals strictly right-aligned with monospace numeric tracking.

### Input Fields & Scanner Bars
- Base height 40px with a 1px `#CBD5E1` border and 12px horizontal padding.
- Focused state: `#2563EB` border with a crisp 2px outer ring (`#DBEAFE`).
- **Global Barcode Input**: Prominently pinned at the top of the POS interface, featuring a barcode icon prefix, clear button suffix, and auto-focus pulse indicator on scan events.

### Cards & Container Panels
- Surface cards feature a clean `#FFFFFF` fill, 1px `#E2E8F0` border, and 16px internal padding.
- Section headers within panels contain bottom borders separating header controls from scrollable line items.