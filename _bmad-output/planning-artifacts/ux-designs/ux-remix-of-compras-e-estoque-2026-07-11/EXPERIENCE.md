---
name: Compras & Estoque
description: Colors-only visual refresh. No IA, layout, or component-position changes — superseded the earlier header/breadcrumb/user-menu/Dashboard-position deltas, which the user rejected.
status: final
updated: 2026-07-11
sources:
  - "DESIGN.md"
---

## Foundation

Responsive web, desktop-first internal operations tool (purchasing + inventory), used on tablet/mobile in the field for counts and quick sales. UI system: **shadcn (new-york style) + Tailwind v4**, unchanged by this pass — see `DESIGN.md` for the visual identity layer (colors, type, radius, shadows) that now sits on top of the existing shadcn primitives (`Sidebar`, `Card`, `Badge`, `Button`, etc.).

**Scope note:** an earlier draft of this document proposed three structural deltas (unified header title + breadcrumb, user menu relocated to the header, Dashboard pinned above the nav groups). The user reviewed the mockups and rejected all three — this pass is colors only, on the app's existing structure, unchanged. Nothing in this document introduces a behavioral, IA, or component-position change; every page keeps rendering its own title exactly as it does today, the user menu stays in the sidebar footer, and Dashboard stays inside the Gestão group.

## Information Architecture

Unchanged. Two sidebar groups, **Navegação** (Produtos, Venda Rápida, Estoque, Contagem, Vencidos — every role) and **Gestão** (Compras, Relatórios, Fornecedores, Configurações, Dashboard — admin/manager only), collapsible to icon-only. No reordering, no new entries.

## Voice and Tone

No copy changes. Brand voice (PT-BR, direct, no marketing tone) is unchanged — see `DESIGN.md`'s Brand & Style section for the visual posture this serves.

## Component Patterns

No behavioral or structural changes to any component. The only delta touching a component's visual character (not its position) is the sidebar's surface — see `DESIGN.md` Colors → Sidebar: it moves from a dark indigo panel to a light surface matching the rest of the shell, still occupying the exact same position and behavior (collapsible, icon-only mode, active/idle states) it has today.

## State Patterns

No new states. No behavioral change to loading, empty, or error states anywhere in the app.

## Interaction Primitives

No changes. Sidebar collapse/expand, navigation, and every existing click/tap target keep their current behavior.

## Accessibility Floor

- Contrast fix carried from `DESIGN.md`: `warning` badges/backgrounds use dark (`text-primary`) foreground text, not white — the previous white-on-`#eab308` combination fails WCAG AA.
- Focus ring recolors to `{colors.ring}` (`primary-500` green) app-wide; no change to *which* elements are focusable or their tab order.
- No other accessibility-relevant change — DOM structure, landmarks, and heading hierarchy are untouched since no element moves.

## Reference mockups

- [`mockups/dashboard.html`](mockups/dashboard.html) — Dashboard exactly as structured today (mobile-only header logo, Dashboard inside Gestão group, per-page title), new colors only.
- [`mockups/purchase-detail.html`](mockups/purchase-detail.html) — purchase order detail exactly as structured today, new colors only.

## Key Flows

Not applicable for a colors-only pass — no journey changes shape, sequence, or outcome for any user.
