# Reconcile — imports/user-index.css

**Source:** user-authored `index.css` at the project root, pasted in full as the desired palette/type/radius/shadow system. Not previously imported anywhere in the app — a standalone draft.

## What was used

Everything. Every value in the file (fonts, background/surface/border scale, `primary-50..900`, `accent-100..600`, status colors, text scale, radii, shadows, gradients) was mapped onto an existing CSS custom property in `src/styles.css` — see `DESIGN.md` frontmatter `colors`/`typography`/`rounded` for the 1:1 mapping. No value from the source file was dropped.

## What required a decision beyond the source file

The source file only defines a light palette and has no opinion on:
- **Sidebar treatment** (dark panel vs. light) — resolved in Discovery: sidebar goes light.
- **How `accent-primary` (today's pervasive indigo brand accent) maps to green vs. cyan** — resolved in Discovery: green (`primary-600`) is the sole brand/action color; cyan (`accent-500`) stays a rare secondary highlight.
- **5th shadow-elevation step** — source only defines 4 shadow levels (`xs/sm/md/lg`); the app's existing scale has 5. Extrapolated one step further — flagged `[ASSUMPTION]` in `DESIGN.md`.
- **`warning-foreground`** — source doesn't specify a foreground for the warning color; white-on-`#eab308` (the app's prior convention) fails contrast, so this pass switches it to dark text.

## Nothing dropped

No qualitative idea from the source file was set aside — the source was a complete, ready-to-map token system, not a mood board with loose ideas to triage.
