---
name: Compras & Estoque
description: Internal purchasing & inventory operations tool — green/cyan visual identity replacing the inherited indigo Loveable theme, built on shadcn (new-york) + Tailwind v4. Colors only; no layout or element-position changes (see EXPERIENCE.md scope note).
status: final
updated: 2026-07-11
sources:
  - "imports/user-index.css"
colors:
  background: "#ffffff"
  background-secondary: "#f7faf8"
  background-tertiary: "#eef6f2"
  background-hover: "#e5f3eb"
  surface: "#ffffff"
  surface-alt: "#f9fbfa"
  surface-dark: "#f1f7f4"
  border: "#dce9e2"
  border-hover: "#bfd9cb"
  border-default: "#dce9e2"
  border-subtle: "#eef6f2"
  primary-50: "#effcf5"
  primary-100: "#daf7e8"
  primary-200: "#b7edd2"
  primary-300: "#83ddb2"
  primary-400: "#49c88c"
  primary-500: "#22b36d"
  primary-600: "#169657"
  primary-700: "#137847"
  primary-800: "#115f3a"
  primary-900: "#0f4a2e"
  primary: "#169657"
  primary-foreground: "#ffffff"
  primary-hover: "#137847"
  secondary: "#f1f7f4"
  secondary-foreground: "#18251f"
  accent-100: "#e8fcff"
  accent-200: "#c5f7ff"
  accent-300: "#8beeff"
  accent-400: "#42ddff"
  accent-500: "#14c7f4"
  accent-600: "#0ba4cf"
  accent: "#14c7f4"
  accent-foreground: "#ffffff"
  muted: "#eef6f2"
  muted-foreground: "#53635b"
  destructive: "#dc2626"
  destructive-foreground: "#ffffff"
  success: "#16a34a"
  success-foreground: "#ffffff"
  warning: "#eab308"
  warning-foreground: "#18251f"
  info: "#0891b2"
  info-foreground: "#ffffff"
  card: "#ffffff"
  card-foreground: "#18251f"
  popover: "#f9fbfa"
  popover-foreground: "#18251f"
  input: "#dce9e2"
  ring: "#22b36d"
  text-primary: "#18251f"
  text-secondary: "#53635b"
  text-tertiary: "#7a8a83"
  text-disabled: "#adb8b2"
  text-white: "#ffffff"
  text-on-dark: "#effcf5"
  text-on-dark-muted: "#b7edd2"
  dark-bg: "#0f4a2e"
  bg-base: "#f7faf8"
  bg-surface-1: "#f9fbfa"
  bg-surface-2: "#eef6f2"
  bg-elevated: "#ffffff"
  bg-subtle-accent: "#effcf5"
  bg-dark: "#115f3a"
  bg-darkest: "#0f4a2e"
  accent-primary: "#169657"
  accent-primary-hover: "#137847"
  accent-primary-light: "#49c88c"
  accent-warm: "#eab308"
  accent-success: "#16a34a"
  sidebar-background: "#f9fbfa"
  sidebar-foreground: "#53635b"
  sidebar-primary: "#169657"
  sidebar-primary-foreground: "#ffffff"
  sidebar-accent: "#effcf5"
  sidebar-accent-foreground: "#137847"
  sidebar-border: "#dce9e2"
  sidebar-ring: "#22b36d"
typography:
  heading:
    fontFamily: "'Space Grotesk', sans-serif"
    fontWeight: 600
  body:
    fontFamily: "'Inter', sans-serif"
    fontWeight: 400
  mono:
    fontFamily: "'JetBrains Mono', monospace"
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "24px"
  full: "9999px"
  DEFAULT: "12px"
spacing:
  container-content: "1200px"
  container-wide: "1680px"
components:
  button-primary:
    background: "{colors.primary}"
    foreground: "{colors.primary-foreground}"
    hoverBackground: "{colors.primary-hover}"
    radius: "{rounded.md}"
  card:
    background: "{colors.bg-elevated}"
    border: "{colors.border-subtle}"
    radius: "{rounded.lg}"
  sidebar:
    background: "{colors.sidebar-background}"
    activeBackground: "{colors.sidebar-accent}"
    activeForeground: "{colors.sidebar-accent-foreground}"
    idleForeground: "{colors.sidebar-foreground}"
  status-pill:
    successForeground: "{colors.success}"
    warningForeground: "{colors.warning}"
    dangerForeground: "{colors.destructive}"
    neutralForeground: "{colors.text-tertiary}"
  kpi-stat:
    iconTone: "{colors.accent-primary}"
    valueForeground: "{colors.text-primary}"
---

## Brand & Style

Compras & Estoque is an internal operations tool for purchasing and inventory — clerks scanning stock, managers approving purchase orders, no one browsing for pleasure. The redesign moves the inherited Loveable indigo theme to a **green-and-cyan operational palette**: green reads as "stock is healthy / action is safe" across a UI dominated by quantities, thresholds and approvals; cyan is reserved as a secondary highlight, not a competing brand color. The posture stays quiet and dense — this is a daily-use tool, not a marketing surface — but two typefaces now do the talking that font-weight alone used to do: **Space Grotesk** gives headings and section titles a slightly technical, structured edge; **Inter** stays the workhorse for everything read at length (labels, table cells, body copy); **JetBrains Mono** is reserved for anything that is literally a code — SKUs, purchase order numbers, batch codes.

No dark-mode values were supplied — this pass targets light mode only, matching the Discovery decision to defer dark mode to a later round. The sidebar also drops its previous dark treatment; see Colors → Sidebar for the full surface breakdown.

## Colors

- **`primary` (`{colors.primary}` = `#169657`)** — the one action color. Every primary button, active nav state, focus ring anchor, and the KPI/status accent that today lives in the `accent-primary` slot converges on this same green. Previously `accent-primary` was a separate indigo brand color used pervasively for icon tones, "sent" status pills, and glow effects (`shadow-accent-glow`); this redesign collapses that into one consistent green so the product doesn't carry two unrelated "brand" colors. Not used for destructive or cautionary states.
- **`accent` (`{colors.accent-500}` = `#14c7f4`)** — cyan, secondary highlight only (the far end of `gradient-primary`, chart secondary series, rare "new/beta" badges). It must stay visibly subordinate to green — if a screen has both, green reads as the primary action.
- **Status colors** — `success` (`#16a34a`), `warning` (`#eab308`), `destructive` (`#dc2626`), and a new `info` (`#0891b2`) slot for neutral informational states that don't yet have a home. These are semantically fixed and never reassigned to brand use, even though `success` is visually close to `primary` — keep them in contexts (badges, inline messages) where the semantic meaning is unambiguous from the icon/label, not just the hue.
- **Surfaces** — `background` (page canvas, `#f7faf8` via `bg-base`) sits one step below `card`/`surface` (`#ffffff`) so cards read as lifted without a heavy shadow. `bg-subtle-accent` (`primary-50`, `#effcf5`) is the faint green wash for hover/selected rows and empty-state panels.
- **Text** — `text-primary` (`#18251f`) is a near-black with a green cast rather than pure black, `text-secondary` (`#53635b`) for supporting copy, `text-tertiary`/`text-disabled` for the quietest layer (timestamps, placeholder counts).
- **Sidebar** — light (`sidebar-background` = `surface-alt`, `#f9fbfa`), matching the rest of the shell rather than standing apart as a dark panel; the active item is what carries the brand color now — `sidebar-accent` (`primary-50` wash) behind `sidebar-accent-foreground` (`primary-700` text), plus `sidebar-primary` (`primary-600`) for any solid-fill accent (e.g. the logo badge). The **Auth screen's decorative side panel** is the only place a dark, near-saturated surface remains (`bg-dark`/`bg-darkest`, deliberately separate from `sidebar-*`) — it stays dark, just retinted from indigo to deep green (`primary-800`/`primary-900`).

## Typography

| Role | Family | Used for |
|---|---|---|
| `{typography.heading}` | Space Grotesk, 600 | Page/section titles (each page's own `<h1>`, unchanged in position), `CardTitle`, dialog titles |
| `{typography.body}` | Inter, 400–600 | Everything else: labels, table cells, form fields, buttons, nav items |
| `{typography.mono}` | JetBrains Mono | SKUs, purchase-order codes (`o.code`), batch/lot numbers, barcode strings |

Weight carries hierarchy inside body copy (Inter 400/500/600/700 already loaded); Space Grotesk is reserved strictly for titles — never body paragraphs, never button labels — so the second family stays a deliberate accent rather than diluting readability.

## Layout & Spacing

No new spacing scale — the app keeps Tailwind's default spacing and the existing `{spacing.container-content}` (1200px) / `{spacing.container-wide}` (1680px) page-width tokens. This pass is a token/value swap only — no element moves, no new spacing rules.

## Elevation & Depth

Shadows keep their existing 5-step elevation scale and glow effects, retinted from indigo/neutral to green so lifted surfaces read as part of the same family as the brand color instead of a generic gray shadow:

| Token | Value |
|---|---|
| `shadow-elevation-1` | `0 1px 2px rgba(17,95,58,.05)` |
| `shadow-elevation-2` | `0 2px 8px rgba(17,95,58,.06)` |
| `shadow-elevation-3` | `0 10px 30px rgba(17,95,58,.08)` |
| `shadow-elevation-4` | `0 18px 50px rgba(17,95,58,.12)` |
| `shadow-elevation-5` | `0 24px 64px rgba(17,95,58,.16)` |
| `shadow-accent-glow` | `0 4px 16px rgba(34,179,109,.25)` |
| `shadow-accent-glow-lg` | `0 8px 24px rgba(34,179,109,.35)` |

[ASSUMPTION] `shadow-elevation-5` is extrapolated — the source palette only defined 4 shadow steps (`xs`/`sm`/`md`/`lg`); this extends the pattern one step further to cover the app's existing 5-level scale.

## Shapes

`{rounded}` replaces the current single `--radius` (10px) base with an explicit 5-step scale (`xs` 6px → `xl` 24px). Buttons, inputs and form controls sit on `{rounded.md}` (12px); cards move from the current ad-hoc `rounded-2xl` (16px, off-scale) to `{rounded.lg}` (18px) so every elevated surface in the app shares one radius vocabulary. `{rounded.full}` stays reserved for avatars, status dots, and the icon badge in the sidebar header.

## Components

- **`button-primary`** — background `{colors.primary}`, hover `{colors.primary-hover}`, text `{colors.primary-foreground}`, radius `{rounded.md}`. This is the only saturated-green filled surface of button size — ghost/outline buttons stay on `{colors.border}`/`{colors.text-primary}`.
- **`card`** — background `{colors.bg-elevated}`, 1px `{colors.border-subtle}` border, radius `{rounded.lg}`, `shadow-elevation-1` at rest. KPI stat cards (Dashboard) and list cards (Products, Purchases) share this spec.
- **`status-pill`** (order/count status badges) — 15%-opacity tint of the semantic color as background, full-strength color as text: `success`/`warning`/`destructive` as today, plus neutral (`draft`, `cancelled`) on `{colors.text-tertiary}` over `{colors.muted}`. No pill should ever use `primary` or `accent` — those are reserved for actions, not states.
- **`sidebar`** — light surface per Colors above; active item gets `{colors.sidebar-accent}` background + `{colors.sidebar-accent-foreground}` text, not a bare color change on the icon alone, so active state is legible even for icon-only (collapsed) mode. Because the sidebar is no longer a dark panel, the active-state contrast against idle items now depends entirely on the `sidebar-accent` wash + text-color pairing — do not ship an active state that is icon-color-only.
- **`kpi-stat`** — icon tone `{colors.accent-primary}` (green, replacing the old mixed indigo/green/warning tones so the four Dashboard tiles read as one family; the warning-toned "Estoque crítico" tile keeps `{colors.warning}` on its icon specifically because that tile's whole point is to stand out from the other three).

## Reference mockups

- [`mockups/dashboard.html`](mockups/dashboard.html) — canonical entry surface: light sidebar with Dashboard pinned above Navegação, unified header title, KPI/status-pill/card tokens at rest.
- [`mockups/purchase-detail.html`](mockups/purchase-detail.html) — breadcrumb + `{typography.mono}` PO code + `status-pill`, shown at rest and with the user-menu overlay open.

## Do's and Don'ts

- **Do** keep cyan (`accent`) rare — a secondary highlight and the tail end of `gradient-primary`, never a second button color.
- **Do** use `{typography.mono}` for anything the user might type into a search box verbatim (SKU, PO code, batch) — it's a functional signal ("this is an identifier"), not decoration.
- **Don't** put `warning-foreground` as white-on-yellow — contrast fails; use `{colors.text-primary}` (dark) on `{colors.warning}` backgrounds instead of the previous white-on-warning convention.
- **Don't** reintroduce indigo/purple anywhere (old `--ring`, `--accent`, `--sidebar-primary`, glow shadows were all indigo) — every one of those slots is retargeted to green/cyan above; a stray indigo value left in a component is a bug, not a variant.
- **Don't** mix the off-scale `rounded-2xl` utility back in once cards move to `{rounded.lg}` — pick the token, not a Tailwind default.
